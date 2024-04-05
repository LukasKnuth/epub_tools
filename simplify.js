const { JSDOM } = require("jsdom")
const { Readability } = require("@mozilla/readability")
const TurndownService = require("turndown")
const yargs = require("yargs")
const { hideBin } = require("yargs/helpers")
const fs = require("fs")
const path = require("path")

// parse cli arguments
const args = yargs(hideBin(process.argv))
  .command("* <files..>", "extract content from given HTML files to Markdown", argv => {
    // NOTE: in the command above, the value in `<>` must match the positonal arg.
    // ALSO: The `..` in there means "this is an array"
    argv.positional("files", {type: "string", normalize: true, default: []})
  }).parseSync()

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

for (const arg of args.files) {
	const full_path = path.join(process.cwd(), arg)
	console.log(`Processing ${full_path}...`)
	const file = fs.readFileSync(full_path, "utf8")
	const simple = simplify(file)
	const output = generateFrontMatter(simple) + generateMarkdown(simple)
	const source_file = path.parse(full_path)
	fs.writeFileSync(path.join(source_file.dir, source_file.name + ".md"), output, "utf8")
	console.log("Done!")
}
