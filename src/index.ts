import fs from "node:fs";
import { parse } from "node-html-parser";
import { optimize } from "svgo";

const cellSpacing = 3;
const cellWidth = 10;
const cellHeight = 10;
const fontSize = 12;

const html = await fetch("https://github.com/users/ChakornK/contributions").then((res) => res.text());
const document = parse(html);

const t = document.querySelector("table.ContributionCalendar-grid");
if (!t) {
  throw new Error("Cannot find contributions table");
}

// character set: ADFJMNOSWabcdeghilnoprstuvy0123456789
const fontB64 = fs.readFileSync("assets/SpaceGrotesk-Regular.woff2", "base64");

let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 686 120" width="686" height="120">
<style>
  @font-face { font-family: f; src: url(data:font/woff2;base64,${fontB64}); }
  .t {
    fill: #003943;
    width: ${cellWidth}px; 
    height: ${cellHeight}px; 
    rx: 2px;
  }
  .s {
    font-family: f;
    font-size: ${fontSize}px; 
    dominant-baseline: hanging; 
  }
  .a { fill: #d4d4cf33; }
  .b { opacity: 0.25; }
  .c { opacity: 0.5; }
  .d { opacity: 0.75; }
  .e { opacity: 1; }
</style>`;
let raw = "";

let x = 0;
let y = 0;

for (const monthLabel of t.querySelectorAll("thead > tr > td.ContributionCalendar-label")) {
  const text = monthLabel.querySelector("[aria-hidden]")!.innerText.trim();
  svg += `<text class="s" x="${x}" y="${y}">${text}</text>`;
  const colSpan = monthLabel.getAttribute("colspan")!;
  x += (cellWidth + cellSpacing) * +colSpan;
}
y += 1;

for (const row of t.querySelectorAll("tbody > tr")) {
  x = 0;
  y += cellHeight + cellSpacing;
  if (raw !== "") raw += "\n";
  for (const tile of row.querySelectorAll("td.ContributionCalendar-day")) {
    const lvl = +tile.getAttribute("data-level")!;
    svg += `<rect class="t ${["a", "b", "c", "d", "e"][lvl]}" x="${x}" y="${y}" />`;
    raw += lvl;
    x += cellWidth + cellSpacing;
  }
}

y += cellHeight + cellSpacing + 2;
const totalContribs = document.querySelector("#js-contribution-activity-description")!.innerText.trim();
svg += `<text class="s" x="0" y="${y}">${totalContribs}</text>`;
raw = `${totalContribs.replaceAll(/[^\d]/g, "")}\n${raw}`;

svg += "</svg>";

const { data: optimized } = optimize(svg, {
  multipass: true,
});

if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist");
}
fs.writeFileSync("dist/graph.svg", optimized);
fs.writeFileSync("dist/graph.txt", raw);
