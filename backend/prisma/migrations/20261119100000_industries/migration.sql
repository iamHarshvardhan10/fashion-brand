
-- CreateTable
CREATE TABLE "industries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "image_public_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "show_in_nav" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_categories" (
    "industry_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "industry_categories_pkey" PRIMARY KEY ("industry_id","category_id")
);

-- CreateTable
CREATE TABLE "product_industries" (
    "product_id" TEXT NOT NULL,
    "industry_id" TEXT NOT NULL,

    CONSTRAINT "product_industries_pkey" PRIMARY KEY ("product_id","industry_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "industries_name_key" ON "industries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "industries_slug_key" ON "industries"("slug");

-- CreateIndex
CREATE INDEX "industries_is_active_sort_order_idx" ON "industries"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "industry_categories_category_id_idx" ON "industry_categories"("category_id");

-- CreateIndex
CREATE INDEX "product_industries_industry_id_idx" ON "product_industries"("industry_id");

-- AddForeignKey
ALTER TABLE "industry_categories" ADD CONSTRAINT "industry_categories_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_categories" ADD CONSTRAINT "industry_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_industries" ADD CONSTRAINT "product_industries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_industries" ADD CONSTRAINT "product_industries_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Data: move products.gender into industries, then retire the column
-- ---------------------------------------------------------------------------

-- Starting industries
INSERT INTO "industries" ("id", "name", "slug", "is_active", "show_in_nav", "sort_order", "created_at", "updated_at") VALUES
    (gen_random_uuid()::text, 'Men', 'men', true, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Women', 'women', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- MEN -> Men, WOMEN -> Women, UNISEX -> both
INSERT INTO "product_industries" ("product_id", "industry_id")
SELECT p."id", i."id"
FROM "products" p
JOIN "industries" i
  ON (i."slug" = 'men'   AND p."gender" IN ('MEN', 'UNISEX'))
  OR (i."slug" = 'women' AND p."gender" IN ('WOMEN', 'UNISEX'));

-- Each industry lists the categories its products are in, in category order
INSERT INTO "industry_categories" ("industry_id", "category_id", "sort_order")
SELECT pi."industry_id", c."id", MIN(c."sort_order")
FROM "product_industries" pi
JOIN "products" p ON p."id" = pi."product_id"
JOIN "categories" c ON c."id" = p."category_id"
GROUP BY pi."industry_id", c."id";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "gender";

-- DropEnum
DROP TYPE "Gender";
