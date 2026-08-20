import CtaLink from "@modules/home/components/cta-link"
import Faceplate from "@modules/home/components/faceplate"

const BuildDesk = () => {
  return (
    <section className="bg-zinc-950 py-16 lg:py-24">
      <div className="content-container">
        <Faceplate code="VLY · Build desk" status="Open 10-19 IST">
          <div className="grid grid-cols-1 gap-10 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-10">
            <div className="flex flex-col gap-5">
              <h2 className="max-w-xl font-display text-3xl leading-[1.1] tracking-tight text-white [font-stretch:108%] md:text-4xl">
                Not sure which box you need?
              </h2>
              <p className="max-w-lg text-base leading-7 text-zinc-400">
                Tell us what you want to run and how much of it you already
                have. We will send back a configuration, a power figure, and a
                price, usually the same day. No call required.
              </p>
            </div>

            <div className="flex flex-col gap-3 xsmall:flex-row lg:flex-col">
              <CtaLink href="/store" tone="dark" className="w-full">
                Shop all builds
              </CtaLink>
              <CtaLink
                href="mailto:build@valyhomelabs.in"
                variant="outline"
                tone="dark"
                className="w-full"
              >
                Email the build desk
              </CtaLink>
            </div>
          </div>
        </Faceplate>
      </div>
    </section>
  )
}

export default BuildDesk
