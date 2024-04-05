# EPUB tools

Some _really simple_ scripts to help create EPUB files from online articles.

There are more complete tools out there.
My main focus is:

* Understandable, simple code
* Human readable file formats that allow manual edits
* Easily customizable - just clone the repo

Here is an example workflow to download a bunch of articles and convert them to an EPUB.

## 0. Installation

Simply clone this repo, run `npm i` to install dependencies and run the scripts via `node`.

## 1. Get content

To download an article and all required assets, we can use `wget` like this:

```bash
wget -p -k -H -nd -P chapter1 https://cool.site/some-article
```

* It downloads the page into the given directory (`-P | --directory-prefix`)
* Alongside the page, it downloads all styles/images/scripts (`-p | --page-requisites`)
* All assets are downloaded into a single, flat directory (`-nd | --no-directories`)
* Even if the assets are from different hosts (`-H | --span-hosts`)
* Then all links to assets are rewritten to the local path (`-k | --convert-links`)

For websites which render using JavaScript, you'll need to use an actual Browser.
[Chrome can get you stated](https://til.simonwillison.net/chrome/headless)

## 2. Simplify to Markdown

We'll use Markdown as our intermediate format.
To simplify the downloaded `index.html` which we just got with "wget", run the tool

```bash
node simplify.js chapter1/index.html
```

This will create a new file to `chapter1/index.md`.
You might want to do some manual cleanup afterward.

You can give multiple HTML files to the script, it will create the output files with the same name in the same folder.
If your shell has [glob support](https://en.wikipedia.org/wiki/Glob_(programming)), you can do things like:

```bash
# Imagine we have "chapter1" and "chapter2" folders downloaded in the "book" folder
node simplify.js book/**/*.html
```

## 3. Bundle to EPUB

Once you're happy with the Markdown files, you can bundle them into an EPUB:

```bash
node bundle.js -a "Author" -t "Title" chapter1/index.md chapter2/index.md
```

Simply list all Markdown files to be bundled into the EPUB.
The files are added in the order in which they are specified.

Optionally, you can specify author and title for the EPUB metadata.

If your shell has glob support, you can do this:

```bash
# Again we have "chapter1" and "chapter2" folders downloaded in the "book" folder
node bundle.js -a "Me" -t "My Book" book/**/*.md
```

## 4. Validate

You can **optionally** validate the bundled EPUB file using [EPUBCheck](https://www.w3.org/publishing/epubcheck/).
This can help find issues in articles that can be manually resolved.
It's a first step when EPUBs are not opened correctly by your chosen reader.

The output has been tested with the following readers:

| Reader | Platform | Issues |
| --- | --- | --- |
| [KOReader](https://github.com/koreader/koreader) | Desktop | :white_check_mark: None |
| KOReader | PocketBook | :white_check_mark: None |
| iBooks | MacOS | :warning: Pages can appear empty. Change any rendering setting (like font size) and content should appear |

# Customization

* To customize output, simply change the templates in the `templates/` folder.
* To customize workflow, change the specific script

## Links and Resources

* [EPUB specification](https://www.w3.org/TR/epub-33/)
* [StandardEbooks to steal ideas from](https://github.com/standardebooks)
* [EPUB Knowledge Docs](https://epubknowledge.com/)

