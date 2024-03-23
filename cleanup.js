const { JSDOM } = require("jsdom")
const { Readability } = require("@mozilla/readability")
const prettier = require("prettier")
const fs = require("fs")

const file = fs.readFileSync(process.argv[2])
const doc = new JSDOM(file)

// Reduce full file to content only:
const reader = new Readability(doc.window.document)
const parsed = reader.parse()

// Remove additional noise
const article = JSDOM.fragment(parsed.content)
article.querySelectorAll("div").forEach(e => e.replaceWith(...e.childNodes))
article.querySelectorAll("figure").forEach(e => {
	e.removeAttribute("data-imgstate")
	const img = e.querySelector("img")
	img.removeAttribute("data-dither")
	img.removeAttribute("data-original")
	img.removeAttribute("loading")
	// todo change img path to reflect relative in ebook
	console.log("Used image: "+img.getAttribute("src"))
	const caption = e.querySelector("figcaption")
	const content = caption.querySelector("span")
	caption.replaceChildren(...content.childNodes)
})

// Setup scaffolding
const dom = new JSDOM(`<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en-US">
<head /><body epub:type="frontmatter"/>
</html>`, {contentType: "application/xhtml+xml"})
const document = dom.window.document
const title = document.createElement("title")
title.text = parsed.title
document.head.append(title)
const section = document.createElement("section")
const header = document.createElement("header")
// todo unwrap article into the thing directly.
section.append(header, ...article.querySelector("article").childNodes)
document.body.append(section)

// Write result
prettier.format(dom.serialize(), {parser: "html"}).then(pretty => fs.writeFileSync("out.xhtml", pretty))
