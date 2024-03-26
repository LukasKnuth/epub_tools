## Get data

This has the list of chapters for the book: https://solar.lowtechmagazine.com/2023/08/thematic-books-series/

Found and downloaded each article here: https://solar.lowtechmagazine.com/archives/

The command is in the justfile as `download` - stolen from https://tinkerlog.dev/journal/downloading-a-webpage-and-all-of-its-assets-with-wget

After download, simply removed anything that isn't required for the article. We'll remove CSS and unneeded images (for recommended articles on the page footer) later on. Mainly removed robots/JS files downloaded by wget.

## Create an ePub

Didn't want to use some tool, so looked at https://standardebooks.org/ which has styles that are designed to work with most readers. **Goal**: Reuse as much of their tooling to generate the most things possible.

They have a manual on how to do things here: https://standardebooks.org/manual/1.7.4 - this contains way more stuff than we actually need, mainly styling and how things are supposed to be organized. We'll ignore that.

The tools are python based and available here: https://github.com/standardebooks/tools - install these

### Setup

Ran `se create-draft -a "LOW TECH MAGAZINE" -t "How to Build a Low-tech Internet?"` to generate a skeleton of the book. This creates the folder strucutre.

```
low-tech-magazine_how-to-build-a-low-tech-internet
├── images
│  ├── cover.jpg
│  ├── cover.svg
│  └── titlepage.svg
├── LICENSE.md
└── src
   ├── epub
   │  ├── content.opf
   │  ├── css
   │  │  ├── core.css
   │  │  ├── local.css
   │  │  └── se.css
   │  ├── images
   │  │  ├── cover.svg
   │  │  ├── logo.svg
   │  │  └── titlepage.svg
   │  ├── onix.xml
   │  ├── text
   │  │  ├── colophon.xhtml
   │  │  ├── imprint.xhtml
   │  │  ├── titlepage.xhtml
   │  │  └── uncopyright.xhtml
   │  └── toc.xhtml
   ├── META-INF
   │  └── container.xml
   └── mimetype
```

We can ignore `LICENSE` as it's not part of the final eBook.
The `images` folder is used **as a source** for the actual images in the `src/images` folder, so it can contai higer resolution images. It's also not part of the final epub file.
The `META-INF`, `mimetype` and `css` content does not need to be touched. For custom CSS stuff, we can use `src/css/local.css`, if we want to.

The `onix.xml`, `toc.xhtml` and `content.opf` are generated with `se` commands.

### Cleaning up content

* I installed BeautifulSoup and wrote a simple python script to strip a lot of extra stuff from the website article HTML
* The cleaned-up HTML is output as valid XHTML from BeautifulSoup
* Had to manually add the header like this:

```xhtml
<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" epub:prefix="z3998: http://www.daisy.org/z3998/2012/vocab/structure/, se: https://standardebooks.org/vocab/1.0" xml:lang="en-US">
<head>
	<title>Chapter 1</title>
	<link href="../css/core.css" rel="stylesheet" type="text/css"/>
	<link href="../css/local.css" rel="stylesheet" type="text/css"/>
</head>
<body epub:type="bodymatter z3998:fiction">
	<section id="chapter-1" epub:type="chapter">
		<!-- Content goes HERE -->
	</section>
</body>
</html>
```

* Ran `se clean .` inside the ebook folder to get better markup and clean document.
* Ran `se typogrify .` inside folder to fix some typografy - didn't do manual pass either, migth be some errors from this script. Not sure if it acutally makes the text better
* Skipped steps 10 - 17
* Manually added `epub:type="title"` attribute to any article titles h1/h2 for ToC
* Ran `se build-manifest .` and `se build-spine .` to update `content.opf`
* Ran `se build-toc .` to update `toc.xhtml`
   * I couldn't get this to ignore other `h2` or to correctly link to them. Manually editing the file now.
* 

## Idea

instead of linting/cleaning up HTML to XHTML, why dont I use a format that allows for less Bullshit? Like markdown? Add a YAML header to metadata as well

Then take a "compiler" that takes everything, compiles it to XHTML and creates the needed scaffolding (like Metadata, Manifest, ToC). I could use file-order for this.

While processing the Markdown, collect all referenced images and put them into the ebpub automatically.

Lastly, we can use Markdowns reference style (where links dont't use the URL but a number and then define the numbers at the bottom) to do footnotes perhaps?

Some things like tables might need to be kept though, but we can do that...

* More good writing on EPUB stuff at https://epubknowledge.com/docs/
* Got a simple CSS boilerplate from http://bbebooksthailand.com/bb-CSS-boilerplate.html
* Some more on EPUB metadata: https://readium.org/architecture/streamer/parser/metadata.html

## Downloading

Got another idea for downloading from https://news.ycombinator.com/item?id=39810378

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --headless --incognito --dump-dom https://github.com > /tmp/github.html
```

**NOTE** This is different from the `wget` command, because it downloads the page _after_ the JavaScript has run. This allows getting pages that rely heavily on it.

## iBooks and validation

The EPub worked fine with KOReader, but it could not be imported in iBooks. I found https://www.w3.org/publishing/epubcheck/ to check the EPubs and it found some fatal issues with my XML.

I updated a bunch of properties required for the `content.opf` file and added a unique UUID to the file. There are still errors, but none of them are about missing metadata in that file.
