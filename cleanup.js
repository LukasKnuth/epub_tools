const { JSDOM } = require("jsdom")
const { Readability } = require("@mozilla/readability")
const TurndownService = require("turndown")
const fs = require("fs")
const path = require("path")

function simplify(html) {
	const doc = new JSDOM(html)
	const reader = new Readability(doc.window.document)
	return reader.parse()
}

function generateMarkdown(readable) {
	const td = new TurndownService({
		headingStyle: "atx",
		bulletListMarker: "-",
		codeBlockStyle: "fenced"
	})
	td.keep(["table"])
	return td.turndown(readable.content)
}

function generateFrontMatter(readable) {
	// NOTE: Can't correctly indent this because then front-matter in the file is indented and breaks YAML
	return `---
title: ${readable.title}
source: ${readable.siteName}
date: ${readable.publishedTime}
author: ${readable.byline}
description: ${readable.excerpt}
---

`
}

for (const arg of process.argv.slice(2)) {
	const full_path = path.join(process.cwd(), arg)
	console.log(`Processing ${full_path}...`)
	const file = fs.readFileSync(full_path)
	const simple = simplify(file)
	const output = generateFrontMatter(simple) + generateMarkdown(simple)
	const source_file = path.parse(full_path)
	fs.writeFileSync(path.join(source_file.dir, source_file.name + ".md"), output)
	console.log("Done!")
}
