import { getMDXComponent } from "mdx-bundler/client";
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import React, { Fragment, useRef } from "react";

import { ScrollToTop, ShareLinks } from "components/blog";
import { Newsletter } from "components/blog/Newsletter";
import { ReadingProgress } from "components/blog/ProgressBar";
import { MDXComponents, MDXWrapper } from "components/mdx";
import { DocumentHead } from "components/shared/seo";
import {
	BlogPostMDXContent,
	PostNotPublishedWarning,
	PostMetaDataGrid,
	EndLinks,
} from "styles/blog";
import { BlogPostTitle, TextGradient, Datestamp } from "styles/typography";
import { TBlogPost } from "typings/blog";
import { getBlogPostData, getBlogPostsSlugs } from "utils/blog";
import { getButtondownSubscriberCount } from "utils/misc";

type TBlogPostPageProps = {
	post: TBlogPost;
	subscriberCount: number;
};

const Post = ({
	code,
	frontmatter,
	subscriberCount,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
	const topRef = useRef<HTMLDivElement>(null);
	// const MDXPost = dynamic(() => import(`content/blog/${post.slug}.mdx`), {
	// 	loading: () => <div dangerouslySetInnerHTML={{ __html: post.content }} />,
	// });

	const Component = getMDXComponent(code);

	return (
		<Fragment>
			<DocumentHead
				title={frontmatter.title}
				imageURL={frontmatter?.image}
				description={frontmatter.summary}
			/>
			<ReadingProgress />
			<div ref={topRef} />
			<BlogPostTitle>
				<TextGradient>{frontmatter.title}</TextGradient>
			</BlogPostTitle>
			<PostMetaDataGrid>
				<Datestamp>
					{new Date(frontmatter.publishedAt).toLocaleDateString("en-US", {
						month: "long",
						year: "numeric",
						day: "numeric",
					})}
					{!frontmatter.published && <PostNotPublishedWarning />}
				</Datestamp>
			</PostMetaDataGrid>
			<BlogPostMDXContent>
				<MDXWrapper>
					{/* @ts-expect-error MDX ugh */}
					<Component components={MDXComponents} />
				</MDXWrapper>
			</BlogPostMDXContent>
			<EndLinks>
				<ShareLinks {...frontmatter} />
				<ScrollToTop topRef={topRef} />
			</EndLinks>
			<Newsletter {...{ subscriberCount }} />
		</Fragment>
	);
};

export const getStaticPaths: GetStaticPaths = async () => {
	const postsSlugs = await getBlogPostsSlugs();
	const paths = postsSlugs.map((slug) => ({
		params: { slug },
	}));

	return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
	if (!params?.slug || Array.isArray(params?.slug)) return { props: {} };

	const subscriberCount = await getButtondownSubscriberCount();
	const result = await getBlogPostData(params?.slug);

	return { props: { ...result, subscriberCount } };
};

export default Post;
