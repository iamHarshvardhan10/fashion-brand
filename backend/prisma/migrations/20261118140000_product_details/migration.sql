-- AlterTable
ALTER TABLE "product_images" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "barcode" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "cod_available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cost_price" INTEGER,
ADD COLUMN     "country_of_origin" TEXT NOT NULL DEFAULT 'India',
ADD COLUMN     "gst_rate" INTEGER,
ADD COLUMN     "height_cm" INTEGER,
ADD COLUMN     "hsn_code" TEXT,
ADD COLUMN     "importer_details" TEXT,
ADD COLUMN     "is_exchangeable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_returnable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "length_cm" INTEGER,
ADD COLUMN     "manufacturer_details" TEXT,
ADD COLUMN     "max_per_order" INTEGER,
ADD COLUMN     "model_info" TEXT,
ADD COLUMN     "net_quantity" TEXT,
ADD COLUMN     "packer_details" TEXT,
ADD COLUMN     "return_window_days" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "search_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "season" TEXT,
ADD COLUMN     "style_code" TEXT,
ADD COLUMN     "video_url" TEXT,
ADD COLUMN     "weight_grams" INTEGER,
ADD COLUMN     "width_cm" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "products_style_code_key" ON "products"("style_code");

