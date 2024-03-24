const { marked } = require("marked")
const { markedXhtml } = require("marked-xhtml")
const frontMatter = require("yaml-front-matter")
const Handlebars = require("handlebars")
const { format } = require("date-fns")
const JSZip = require("jszip")
const fs = require("fs")
const path = require("path")

// setup
marked.use(markedXhtml())

const articleTemplate = Handlebars.compile(fs.readFileSync("templates/article.xhtml").toString())
const tocTemplate = Handlebars.compile(fs.readFileSync("templates/toc.xhtml").toString())
const manifestTemplate = Handlebars.compile(fs.readFileSync("templates/content.opf").toString())

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
  // TODO matter.date = format(matter.date, "")
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
  // TODO place CSS files in there...
  return zip
}

function writeArticle(zip, article) {
  const content = marked.parse(article.__content)
  const rendered = articleTemplate({...article, content})
  const file = article.id+".xhtml"
  zip.file(file, rendered)
  return {file, id: article.id, title: article.title}
}

function writeManifest(zip, toc) {
  const file = "toc.xhtml"
  zip.file(file, tocTemplate({toc}))
  // TODO Also needs CSS and Images!
  zip.file("content.opf", manifestTemplate({files: toc}))
}

const articles = listDirectory(process.argv[2]).filter(markdownFile).map(parseArticle)
const zip = setupZip()
const folder = zip.folder("OEBPS")
const toc = articles.map(a => writeArticle(folder, a))
writeManifest(folder, toc)
zip.generateNodeStream()
  .pipe(fs.createWriteStream("out.epub"))
  .on("finish", () => {
    console.log("Complete.")
  })
