import sys
from bs4 import BeautifulSoup

def cleanup(tag):
	for noise in tag.find_all(["div", "section", "header"]):
		noise.unwrap()

	for figure in tag.find_all("figure"):
		# todo remove uneeded props figure.find("img")
		caption = figure.find("figcaption")
		cap_text = caption.find("span")
		cap_text.name = "figcaption"
		caption.replace_with(cap_text)


with open(sys.argv[1]) as source:
	soup = BeautifulSoup(source, "html.parser")
	article = soup.find("section", id="content")
	cleanup(article)
	footnotes = soup.find("section", id="reference")
	cleanup(footnotes)
	with open("out.xhtml", "w") as dest:
		dest.write(str(article))
		dest.write(str(footnotes))

print("Done")