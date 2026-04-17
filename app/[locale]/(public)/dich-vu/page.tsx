import { getTranslations } from "next-intl/server"
import { MediaOrderForm } from "./MediaOrderForm"

export async function generateMetadata() {
  const t = await getTranslations("services")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
  }
}

export default async function MediaServicePage() {
  const t = await getTranslations("services")

  const services = [
    { icon: "📝", title: t("svc1Title"), description: t("svc1Desc"), price: t("svc1Price"), serviceType: "ARTICLE_COMPANY" },
    { icon: "🛍️", title: t("svc2Title"), description: t("svc2Desc"), price: t("svc2Price"), serviceType: "ARTICLE_PRODUCT" },
    { icon: "📰", title: t("svc3Title"), description: t("svc3Desc"), price: t("svc3Price"), serviceType: "PRESS_RELEASE" },
    { icon: "📱", title: t("svc4Title"), description: t("svc4Desc"), price: t("svc4Price"), serviceType: "SOCIAL_CONTENT" },
  ]

  const steps = [
    { step: 1, title: t("step1Title"), description: t("step1Desc") },
    { step: 2, title: t("step2Title"), description: t("step2Desc") },
    { step: 3, title: t("step3Title"), description: t("step3Desc") },
    { step: 4, title: t("step4Title"), description: t("step4Desc") },
  ]

  return (
    <div className="min-h-screen bg-brand-50/60">
      {/* Hero */}
      <section className="bg-brand-800 py-20 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">
          {t("heroTitle")}
        </h1>
        <p className="mt-3 text-brand-300 text-lg max-w-2xl mx-auto">
          {t("heroDesc")}
        </p>
      </section>

      {/* Content card */}
      <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">

        {/* Service Cards */}
        <section className="px-6 sm:px-10 py-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            {t("ourServices")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {services.map((svc) => (
              <div
                key={svc.serviceType}
                className="bg-brand-50/50 rounded-xl border border-brand-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="text-3xl">{svc.icon}</div>
                <h3 className="text-lg font-semibold text-foreground">{svc.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{svc.description}</p>
                <p className="text-brand-700 font-semibold text-sm">{svc.price}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process Steps */}
        <section className="bg-brand-50/50 py-12 px-6 sm:px-10">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            {t("processTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.step} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-700 text-brand-100 flex items-center justify-center text-xl font-bold mx-auto">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Order Form */}
        <section className="px-6 sm:px-10 py-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">
            {t("orderTitle")}
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-8">
            {t("orderDesc")}
          </p>
          <div className="max-w-2xl mx-auto bg-brand-50/50 rounded-xl border border-brand-200 p-6">
            <MediaOrderForm />
          </div>
        </section>

      </div>
      </div>
    </div>
  )
}
