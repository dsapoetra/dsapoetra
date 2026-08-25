import { MDXRemote } from 'next-mdx-remote-client/rsc'

const components = {
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2 className="mt-10 mb-3 font-sans text-lg font-semibold text-ink" {...props} />
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3 className="mt-8 mb-2 font-sans text-base font-semibold text-ink" {...props} />
  ),
  p: (props: React.ComponentProps<'p'>) => (
    <p className="mb-5 leading-8 text-ink" {...props} />
  ),
  a: (props: React.ComponentProps<'a'>) => (
    <a className="text-accent underline underline-offset-4" {...props} />
  ),
  blockquote: (props: React.ComponentProps<'blockquote'>) => (
    <blockquote
      className="my-6 border-l-2 border-rule pl-5 text-muted italic"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-rule" />,
}

export default function MdxContent({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />
}
