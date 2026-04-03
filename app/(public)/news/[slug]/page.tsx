export default async function NewsDetailPage(props: PageProps<"/news/[slug]">) {
  const { slug } = await props.params

  return (
    <div>
      <h1>Tin tức: {slug}</h1>
    </div>
  )
}
