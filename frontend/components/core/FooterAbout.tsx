import Link from "next/link";
import { site } from "@/lib/site";

// Long-form "about shopping with us" copy shown under the footer (also useful for SEO).
// TODO: review and edit this copy so it matches the brand's real story and offers.

type Section = {
    title: string;
    paragraphs?: React.ReactNode[];
    list?: { lead: string; text: React.ReactNode }[];
    after?: React.ReactNode[];
    tiers?: { name: string; perks: string[] }[];
};

const inlineLink = "text-neutral-800 hover:text-brand";

const sections: Section[] = [
    {
        title: `Online shopping made easy at ${site.name}`,
        paragraphs: [
            <>
                Looking for clothes that feel like you? {site.name} is your destination for{" "}
                <Link href="/men" className={inlineLink}>menswear</Link>, streetwear, sneakers and accessories designed
                for everyday life. From the first tee of the season to the jacket you&rsquo;ll wear for years, every
                piece is picked to look good, last long and fit right. Shop from anywhere and get your favourites
                delivered to your doorstep.
            </>,
        ],
    },
    {
        title: "Best online shopping site for everyday fashion",
        paragraphs: [
            "Whether you're dressing for work, a weekend away or a night out, we've got the right fit for the moment. Here's what you'll find on our shelves.",
        ],
        list: [
            {
                lead: "Smart menswear",
                text: (
                    <>
                        Crisp <Link href="/shirts" className={inlineLink}>shirts</Link>, relaxed trousers and tailored
                        overshirts that move from desk to dinner without a change. Choose from linen, oxford, corduroy
                        and denim in cuts that range from slim to boxy.
                    </>
                ),
            },
            {
                lead: "Streetwear essentials",
                text: (
                    <>
                        Oversized graphic <Link href="/tshirts" className={inlineLink}>T-shirts</Link>, heavyweight
                        hoodies, cargo pants and baggy jeans. Layer them up or keep it simple &mdash; the fits are built
                        to be worn hard and washed often.
                    </>
                ),
            },
            {
                lead: "Sneakers & footwear",
                text: (
                    <>
                        Clean court shoes, chunky runners and suede skate styles to finish any outfit. Browse the full{" "}
                        <Link href="/sneakers" className={inlineLink}>sneaker</Link> range, with new pairs landing every
                        drop.
                    </>
                ),
            },
            {
                lead: "Accessories that finish the look",
                text: "Leather belts, caps, socks, backpacks and sunglasses — the small details that make an outfit yours.",
            },
            {
                lead: "Fragrances",
                text: "Fresh, woody and spicy perfumes to match your mood, in travel sizes and full bottles.",
            },
        ],
    },
    {
        title: "Affordable fashion at your fingertips",
        paragraphs: [
            <>
                Great style shouldn&rsquo;t cost a fortune. Check out{" "}
                <Link href="/new-in" className={inlineLink}>new arrivals</Link> every week, grab limited drops before
                they sell out, and save big during our seasonal{" "}
                <Link href="/sale" className={inlineLink}>sale</Link> on shirts, jeans, sneakers and more.
            </>,
        ],
    },
    {
        title: "The Inner Circle",
        paragraphs: [
            <>
                Every order counts. <Link href="/membership" className={inlineLink}>The Inner Circle</Link> is our
                membership program that rewards you for shopping with us. Members earn points on every purchase and
                unlock new perks as they move up the tiers.
            </>,
        ],
        tiers: [
            { name: "Member", perks: ["Extra 10% off on every order.", "Birthday month surprise."] },
            { name: "Insider", perks: ["Early access to every drop and sale.", "Free express shipping."] },
            { name: "Icon", perks: ["Invites to launch events and styling sessions.", "First pick of limited-edition pieces."] },
        ],
    },
    {
        title: `${site.name} app`,
        paragraphs: [
            "Shop faster with our app. Get drop alerts the moment new styles go live, track your orders in real time, save favourites to your watchlist and check out in a couple of taps. Download it on Android or iOS and take the store with you wherever you go.",
        ],
    },
    {
        title: `The story of ${site.name}`,
        paragraphs: [
            "We started with a simple idea: make clothes we'd actually want to wear, and sell them at prices that make sense. What began as a small run of tees has grown into a full wardrobe — shirts, denim, outerwear, sneakers and accessories — designed for people who like to dress with a point of view.",
        ],
    },
    {
        title: `Shop online at ${site.name} with complete convenience`,
        paragraphs: [
            "Detailed size guides, honest product descriptions and high-resolution photos help you choose with confidence. Pay the way you like — UPI, cards, netbanking or cash on delivery — and if something isn't right, our 15-day returns and exchanges have you covered.",
            "Shop comfortably from home or on the go, and send something special to friends and family with our gift cards.",
        ],
    },
];

export default function FooterAbout() {
    return (
        <div className="space-y-8 text-sm leading-relaxed text-[#94969f]">
            {sections.map((section) => (
                <section key={section.title}>
                    <h3 className="mb-2 font-mono text-xs font-bold tracking-[0.12em] text-neutral-800 uppercase">
                        {section.title}
                    </h3>
                    <div className="space-y-3">
                        {section.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}

                        {section.list && (
                            <ol className="list-decimal space-y-3 pl-10">
                                {section.list.map((item) => (
                                    <li key={item.lead}>
                                        <strong className="font-semibold text-neutral-800">{item.lead}</strong> &ndash; {item.text}
                                    </li>
                                ))}
                            </ol>
                        )}

                        {section.tiers?.map((tier) => (
                            <div key={tier.name}>
                                <p className="font-semibold text-neutral-800">{tier.name}</p>
                                <ul className="mt-1 list-disc space-y-1 pl-10">
                                    {tier.perks.map((perk) => (
                                        <li key={perk}>{perk}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
