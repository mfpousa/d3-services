import React from "react";
import ReactDOM from "react-dom";
import * as d3 from "d3";

import "./styles.scss";

function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <div class="Container" />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

const data = {
  nodes: [
    {
      id: "Registry",
      type: "service"
    },
    {
      id: "Initializer",
      type: "service"
    },
    {
      id: "Finaliser",
      type: "service"
    },
    {
      id: "Queue1",
      type: "queue"
    }
  ],
  links: [
    {
      source: "Registry",
      target: "Initializer",
      type: "solid"
    },
    {
      source: "Initializer",
      target: "Finaliser",
      type: "solid"
    },
    {
      source: "Finaliser",
      target: "Queue1",
      type: "dashed"
    }
  ]
};

const links = data.links.map(d => Object.create(d));
const nodes = data.nodes.map(d => Object.create(d));
const width = 600;
const height = 600;

const drag = simulation => {
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};

const simulation = d3
  .forceSimulation(nodes)
  .force(
    "link",
    d3
      .forceLink()
      .strength(2)
      .links(links)
      .distance(200)
      .id(d => d.id)
  )
  .force("charge", d3.forceManyBody())
  .force(
    "collisionForce",
    d3
      .forceCollide()
      .strength(10)
      .radius(30)
  )
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("charge", d3.forceY(0));

var container = d3.select(".Container");
var svg = d3
  .select(".Container")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%");
var linksLayer = svg.append("g").classed("Links", true);
var dotsLater = svg.append("g").classed("Dots", true);
var nodesLayer = container.append("div").classed("Nodes", true);

var node = nodesLayer
  .selectAll("div")
  .data(nodes)
  .join("div")
  .attr("id", (s, index) => `node-${index}`)
  .attr("class", n => `Node ${n.type}`)
  .call(drag(simulation));
node.append("p").text(s => s.id);

var link = linksLayer
  .selectAll("g")
  .data(links)
  .join("g")
  .attr("class", l => `Link ${l.type}`);
link.append("path").attr("id", (l, index) => `link-${index}`);

var dot = dotsLater
  .selectAll("circle")
  .data(links)
  .join("circle")
  .attr("class", l => `Dot ${l.type}`);
dot
  .attr("r", "0.25rem")
  .append("animateMotion")
  .attr("dur", "1.6s")
  .attr("repeatCount", "indefinite")
  .append("mpath")
  .attr("xlink:xlink:href", (l, index) => `#link-${index}`);

simulation.on("tick", () => {
  node.style("left", n => `${n.x}px`).style("top", n => `${n.y}px`);
  link.select("path").attr("d", n => {
    const vector = [n.target.x - n.source.x, n.target.y - n.source.y];
    const vectorMagnitude = Math.sqrt(
      vector[0] * vector[0] + vector[1] * vector[1]
    );
    const uVector = [vector[0] / vectorMagnitude, vector[1] / vectorMagnitude];
    const source = d3.select(`#node-${n.source.index}`).node();
    const target = d3.select(`#node-${n.target.index}`).node();
    const toRight =
      target.getBoundingClientRect().x > source.getBoundingClientRect().x;
    const [x0, y0, x1, y1] = toRight
      ? [
          n.source.x + source.getBoundingClientRect().width / 2 - 0,
          n.source.y,
          n.target.x - target.getBoundingClientRect().width / 2 + 5,
          n.target.y
        ]
      : [
          n.source.x - source.getBoundingClientRect().width / 2 + 5,
          n.source.y,
          n.target.x + target.getBoundingClientRect().width / 2 - 5,
          n.target.y
        ];
    const lineCurvature =
      Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) * 0.7;
    const [px0, py0, px1, py1] = toRight
      ? [x0 + uVector[0] * lineCurvature, y0, x1, y1]
      : [x0 + uVector[0] * lineCurvature, y0, x1, y1];
    return `M${x0},${y0} C${px0},${py0} ${px1},${py1} ${x1},${y1}`;
  });
});
