import { promises as fs } from "fs";
import path from "path";

import { bundleMDX } from "mdx-bundler";

import { getMdxString } from "components/mdx";
import { TBlogPost } from "typings/blog";

const PATH = path.resolve(process.cwd(), "src");
const DIR = path.resolve(PATH, "content", "blog");

export const getBlogPreviewImageURL = ({ slug }: { slug: TBlogPost["slug"] }) =>
	`${process.env.SITE_URL}/blog/${slug}/preview.png`;

export const getBlogPostsData = async () => {
	const META = /export\s+const\s+meta\s+=\s+(\{(\n|.)*?\n\})/;
	const DIR = path.join(process.cwd(), "src", "content", "blog");
	const files = (await fs.readdir(DIR)).filter((file) => file.endsWith(".mdx"));
	const entries = await Promise.all(files.map((file) => import(`content/blog/${file}`)));

	const postsData: Array<TBlogPost> = await Promise.all(
		files
			.map(async (file, index) => {
				const name = path.join(DIR, file);
				const contents = await fs.readFile(name, "utf8");
				const match = META.exec(contents);

				if (!match || typeof match[1] !== "string")
					throw new Error(`${name} needs to export const meta = {}`);

				const meta = eval("(" + match[1] + ")");
				const slug = file.replace(/\.mdx?$/, "");
				const MDXContent = entries[index].default;

				return {
					...meta,
					slug,
					image: getBlogPreviewImageURL({ slug }),
					content: getMdxString(<MDXContent />),
				};
			})
			.filter((meta) => process.env.NODE_ENV === "development" || meta.published)
			.sort((a, b) => {
				return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
			})
	);

	return postsData;
};

export async function getBlogPostsSlugs() {
	const postsSlugs = (await fs.readdir(DIR))
		.filter((file) => file.endsWith(".mdx"))
		.map((slug) => slug.replace(/\.mdx?$/, ""));
	return postsSlugs;
}

export async function getBlogPostData(file: string) {
	const name = path.resolve(DIR, `${file}.mdx`);
	const mdxSource = await fs.readFile(name, "utf8");

	const result = await bundleMDX(mdxSource, {
		cwd: path.dirname(name),
		esbuildOptions(options) {
			options.platform = "node";

			return options;
		},
	});

	return result;
}

export const getAboutMDXPagesData = async () => {
	/**
	 * so Next.js (correctly) prevents us from building a website wherein we're
	 * trying to dynamically trying to create a page that _already_ exists
	 * "statically" - in our repo this can be seen when using our traditional
	 * approach we were creating pages for all the .mdx files in from the /content
	 * dir, but we've already defined a pages/about.tsx
	 *
	 * to counter this, we'll add logic here in order to only create static paths
	 * for pages that _dont_ exist already
	 */

	const DIR = path.resolve(process.cwd(), "src", "content");
	const existingPagesDIR = path.resolve(process.cwd(), "src", "pages");

	const files = (await fs.readdir(DIR)).filter((file) => file.endsWith(".mdx"));
	const existingAboutPageFiles = (await fs.readdir(existingPagesDIR))
		.filter((file) => file.endsWith(".tsx"))
		.map((file) => file.replace(/\.tsx?$/, ""));

	const pagesData: Array<{ page: string }> = files
		.map((file) => {
			return {
				page: file.replace(/\.mdx?$/, ""),
			};
		})
		.filter(({ page }) => existingAboutPageFiles.indexOf(page) === -1);

	const pagesDataWithContent = pagesData.map((data) => {
		return {
			...data,
		};
	});

	return pagesDataWithContent;
};
