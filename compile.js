const { marked } = require("marked")
const { markedXhtml } = require("marked-xhtml")
const frontMatter = require("yaml-front-matter")
const Handlebars = require("handlebars")
const { format } = require("date-fns")
const JSZip = require("jszip")
const mime = require("mime-types")
const yargs = require("yargs")
const { hideBin } = require("yargs/helpers")
const fs = require("fs")
const path = require("path")
const { randomUUID } = require("crypto")

// parse cli arguments
const args = yargs(hideBin(process.argv))
  .command("* <folder>", "create an EPUB from the given directory", argv => {
    argv.positional("folder", {type: "string"})
      .alias("a", "author")
      .alias("t", "title")
  }).parseSync()

// setup
const base_path = path.join(process.cwd(), args.folder)
marked.use(markedXhtml())
marked.use({renderer: {image: (href, title, text) => {
  // Make sure images are always block elements and presented stand-alone
  return `<figure><img src="${href}"/><figcaption>${text}</figcaption></figure>`
}, paragraph: (text) => {
  // <figure> inside <p> is invalid HTML/XHTML. Make sure we don't wrap them
  // Stolen from https://github.com/markedjs/marked/issues/773
  if (text.startsWith("<figure") && text.endsWith("</figure>")) {
    return text;
  } else {
    return `<p>${text}</p>`
  }
}}})

function loadTemplate(path) {
  return Handlebars.compile(fs.readFileSync(path, "utf8").toString())
}

const articleTemplate = loadTemplate("templates/article.xhtml")
const tocTemplate = loadTemplate("templates/toc.xhtml")
const manifestTemplate = loadTemplate("templates/content.opf")

function listDirectory(folder) {
  return fs.readdirSync(folder, {recursive: false, withFileTypes: true}).filter(f => {
    return f.isFile()
  }).map(f => path.join(folder, f.name))
}

function markdownFile(file) {
  if (path.extname(file) === ".md") {
    return true
  } else {
    console.log(`Skipping ${file}, not a markdown file`)
    return false
  }
}

function parseArticle(file) {
  const content = fs.readFileSync(file, "utf-8")
  const matter = frontMatter.safeLoadFront(content)
  // file-name without the extension
  matter.id = path.parse(file).name
  matter.date = format(matter.date, "MMM do, yyy")
  return matter
}

function setupZip() {
  const zip = new JSZip()
  zip.file("mimetype", "application/epub+zip")
  zip.folder("META-INF").file("container.xml", `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`)
  zip.folder("OEBPS").folder("css").file("style.css", fs.readFileSync("templates/style.css", "utf8"))
  return zip
}

function writeImages(tokens, base_path, article_id, zip, results) {
  for (const token of tokens) {
    if (token.type === "image") {
      const full_path = path.join(base_path, token.href)
      if (fs.existsSync(full_path)) {
        const file = path.parse(full_path)
        const zip_path = `img/${article_id}/${file.base}`
        // add to Zip
        zip.file(zip_path, fs.createReadStream(full_path))
        // Rewrite href
        token.href = zip_path
        // add to manifest
        const mimetype = mime.lookup(file.ext)
        results.push({file: zip_path, id: `${article_id}-${file.name}`, mimetype})
      } else {
        console.warn(`Image ${full_path} not found. Ignoring...`)
      }
    } else {
      if ((token.tokens || []).length > 0) {
        writeImages(token.tokens, base_path, article_id, zip, results)
      }
    }
  }
  return results
}

function writeArticle(zip, article) {
  const tokens = marked.lexer(article.__content)
  const image_files = writeImages(tokens, base_path, article.id, zip, [])
  const content = marked.parser(tokens)
  const rendered = articleTemplate({...article, content})
  const file = article.id+".xhtml"
  zip.file(file, rendered)
  return [{file, id: article.id, title: article.title, mimetype: "application/xhtml+xml"}, ...image_files]
}

function writeManifest(zip, files) {
  const toc = files.filter(f => !!f.title)
  zip.file("toc.xhtml", tocTemplate({toc, title: args.title, author: args.author}))
  zip.file("content.opf", manifestTemplate({
    files, toc, author: args.author, title: args.title,
    modified: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"), uuid: randomUUID()
  }))
}

const articles = listDirectory(base_path).filter(markdownFile).map(parseArticle)
const zip = setupZip()
const folder = zip.folder("OEBPS")
const toc = articles.flatMap(a => writeArticle(folder, a))
writeManifest(folder, toc)
zip.generateNodeStream()
  .pipe(fs.createWriteStream("out.epub"))
  .on("finish", () => {
    console.log("Complete.")
  })
