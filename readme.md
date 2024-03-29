# EPUB tools

These are some _really simple_ scripts to help create EPUB files from online articles.
There are more complete tools out there.

My main focus is:

* A process that doesn't assume anything
* Understandable, simple code
* Very simple output that doesn't assume much
* Easily customizable - just clone the repo

An example workflow to download a bunch of articles and convert them to an EPUB.

## 0. Installation

Simply clone this repo, run `npm i` to install dependencies and run the scripts via `node`.

## 1. Get content

To download an article and all required assets, we can use `wget` like this:

```bash
wget --page-requisites --convert-links --span-hosts --no-directories https://www.example.com
```

* It downloads the page you point it to into the current directory
* Alongside the page, it downloads all styles/images/scripts (`--page-requirements`)
* All assets are downloaded into a single, flat directory (`--no-directories`)
* Even if the assets are from different hosts (`--span-hosts`)
* Then all links to assets are rewritten to the local path (`--convert-links`)

For websites which render using JavaScript, you'll need to use an actual Browser.
[Chrome can get you stated](https://til.simonwillison.net/chrome/headless)

## 2. Simplify to Markdown

We'll use Markdown as our itermediate format.
To simplify the downloaded `index.html` which we just got with "wget", run the tool

```bash
node simplify.js folder/index.html
```

This will create a new file to `folder/index.md`.
The file might require manual cleanup afterwards.
You can specify multiple HTML files to the script, it will create the output files with the same name in the same folder.

## 3. Bundle to EPUB

Once you're happy with the Markdown files, you can bundle them into an EPUB:

```bash
node bundle.js folder --author "Somebody" --title "Your Book"
```

Specify the folder in which _all_ Markdown files are located.
Optionally, you can specify author and title for the EPUB metadat.

The files will be added to the EPUB in the order in which they appear in the folder.
To influence the order, you can prefix the filenames with numbers.

## 4. Validate

You can **optionally** validate the bundled EPUB file using [EPUBCheck](https://www.w3.org/publishing/epubcheck/).
This can help find issues in articles that can be manually resolved.
It's a first step when EPUBs are not opened correctly by your chosen reader.

The output has been tested with the following readers:

| Reader | Platform | Issues |
------------------------------
| [KOReader](https://github.com/koreader/koreader) | Desktop | None |
| KOReader | PocketBook | None |
| iBooks | MacOS | Pages can appear empty. Change any rendering setting (like font size) and content should appear |

# Customization

* To customize output, simply change the templates in the `templates/` folder.
* To customize workflow, change the specific script

## Links and Resources

* [EPUB specification](https://www.w3.org/TR/epub-33/)
* [StandardEbooks to steal ideas from](https://github.com/standardebooks)
* [Epub Knowledge Docs](https://epubknowledge.com/)

