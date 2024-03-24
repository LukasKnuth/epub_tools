const { JSDOM } = require("jsdom")
const { Readability } = require("@mozilla/readability")
const prettier = require("prettier")
const TurndownService = require("turndown")
const fs = require("fs")

const file = fs.readFileSync(process.argv[2])
const doc = new JSDOM(file)

// Reduce full file to content only:
const reader = new Readability(doc.window.document)
const parsed = reader.parse()

// Remove additional noise
const article = JSDOM.fragment(parsed.content)
article.querySelectorAll("img").forEach(e => {
	// todo change img path to reflect relative in ebook
	console.log("Used image: "+e.getAttribute("src"))
})

const td = new TurndownService({
	headingStyle: "atx",
	bulletListMarker: "-",
	codeBlockStyle: "fenced"
})
td.keep(["table"])
const out = td.turndown(article)


// Setup scaffolding
// TODO write YAML header with title, description, author, etz.
const header = `---
title: ${parsed.title}
source: ${parsed.siteName}
date: ${parsed.publishedTime}
author: ${parsed.byline}
description: ${parsed.excerpt}
---

`

// Write result
fs.writeFileSync("out.md", header+out)
