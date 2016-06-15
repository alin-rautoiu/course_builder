function init() {
    if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
    var $ = go.GraphObject.make;  // for conciseness in defining templates
    myDiagram =
      $(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
        {
          initialContentAlignment: go.Spot.Center,
          allowDrop: true,  // must be true to accept drops from the Palette
          "LinkDrawn": showLinkLabel,  // this DiagramEvent listener is defined below
          "LinkRelinked": showLinkLabel,
          "animationManager.duration": 800, // slightly longer than default (600ms) animation
          "undoManager.isEnabled": true  // enable undo & redo
        });

    // helper definitions for node templates
    function nodeStyle() {
      return [
        // The Node.location comes from the "loc" property of the node data,
        // converted by the Point.parse static method.
        // If the Node.location is changed, it updates the "loc" property of the node data,
        // converting back using the Point.stringify static method.
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        {
          // the Node.location is at the center of each node
          locationSpot: go.Spot.Center,
          //isShadowed: true,
          //shadowColor: "#888",
          // handle mouse enter/leave events to show/hide the ports
          mouseEnter: function (e, obj) { showPorts(obj.part, true); },
          mouseLeave: function (e, obj) { showPorts(obj.part, false); }
        }
      ];
    }
    // Define a function for creating a "port" that is normally transparent.
    // The "name" is used as the GraphObject.portId, the "spot" is used to control how links connect
    // and where the port is positioned on the node, and the boolean "output" and "input" arguments
    // control whether the user can draw links from or to the port.
    function makePort(name, spot, output, input) {
      // the port is basically just a small circle that has a white stroke when it is made visible
      return $(go.Shape, "Circle",
               {
                  fill: "transparent",
                  stroke: null,  // this is changed to "white" in the showPorts function
                  desiredSize: new go.Size(8, 8),
                  alignment: spot, alignmentFocus: spot,  // align the port on the main Shape
                  portId: name,  // declare this object to be a "port"
                  fromSpot: spot, toSpot: spot,  // declare where links may connect at this port
                  fromLinkable: output, toLinkable: input,  // declare whether the user may draw links to/from here
                  cursor: "pointer"  // show a different cursor to indicate potential link point
               });
    }
    // define the Node templates for regular nodes
    var lightText = 'whitesmoke';
    myDiagram.nodeTemplateMap.add("",  // the default category
      $(go.Node, "Spot", nodeStyle(),
        // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
        $(go.Panel, "Auto",
          $(go.Shape, "Rectangle",
            { fill: "#00A9C9", stroke: null },
            new go.Binding("figure", "figure")),
          $(go.TextBlock,
            {
              font: "bold 11pt Helvetica, Arial, sans-serif",
              stroke: lightText,
              margin: 8,
              maxSize: new go.Size(160, NaN),
              wrap: go.TextBlock.WrapFit,
              editable: true
            },
            new go.Binding("text").makeTwoWay())
        ),
        // four named ports, one on each side:
        makePort("T", go.Spot.Top, true, true),
        makePort("L", go.Spot.Left, true, true),
        makePort("R", go.Spot.Right, true, true),
        makePort("B", go.Spot.Bottom, true, true)
      ));
  
    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate =
      $(go.Link,  // the whole link panel
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 5, toShortLength: 4,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true,
          resegmentable: true,
          // mouse-overs subtly highlight links:
          mouseEnter: function(e, link) { link.findObject("HIGHLIGHT").stroke = "rgba(30,144,255,0.2)"; },
          mouseLeave: function(e, link) { link.findObject("HIGHLIGHT").stroke = "transparent"; }
        },
        new go.Binding("points").makeTwoWay(),
        $(go.Shape,  // the highlight shape, normally transparent
          { isPanelMain: true, strokeWidth: 8, stroke: "transparent", name: "HIGHLIGHT" }),
        $(go.Shape,  // the link path shape
          { isPanelMain: true, stroke: "gray", strokeWidth: 2 }),
        $(go.Shape,  // the arrowhead
          { toArrow: "standard", stroke: null, fill: "gray"}),
        $(go.Panel, "Auto",  // the link label, normally not visible
          { visible: false, name: "LABEL", segmentIndex: 2, segmentFraction: 0.5},
          new go.Binding("visible", "visible").makeTwoWay(),
          $(go.Shape, "RoundedRectangle",  // the label shape
            { fill: "#F8F8F8", stroke: null }),
          $(go.TextBlock, "Yes",  // the label
            {
              textAlign: "center",
              font: "10pt helvetica, arial, sans-serif",
              stroke: "#333333",
              editable: true
            },
            new go.Binding("text").makeTwoWay())
        )
      );
    // Make link labels visible if coming out of a "conditional" node.
    // This listener is called by the "LinkDrawn" and "LinkRelinked" DiagramEvents.
    function showLinkLabel(e) {
      var label = e.subject.findObject("LABEL");
      if (label !== null) label.visible = (e.subject.fromNode.data.figure === "RoundedRectangle");
    }
    // temporary links used by LinkingTool and RelinkingTool are also orthogonal:
    myDiagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
    myDiagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;
    load();  // load an initial diagram from some JSON text
    // initialize the Palette that is on the left side of the page
    myPalette =
      $(go.Palette, "myPaletteDiv",  // must name or refer to the DIV HTML element
        {
          "animationManager.duration": 800, // slightly longer than default (600ms) animation
          nodeTemplateMap: myDiagram.nodeTemplateMap,  // share the templates used by myDiagram
          model: new go.GraphLinksModel([  // specify the contents of the Palette
            { text: "Step", figure: "RoundedRectangle" }
          ])
        });
  }
  // Make all ports on a node visible when the mouse is over the node
  function showPorts(node, show) {
    var diagram = node.diagram;
    if (!diagram || diagram.isReadOnly || !diagram.allowLink) return;
    node.ports.each(function(port) {
        port.stroke = (show ? "white" : null);
      });
  }
  // Show the diagram's model in JSON format that the user may edit
  

function getCourse(links) {
    var course = {
    "course": {
      "title": "Course title",
      "image": "https://newevolutiondesigns.com/images/freebies/abstract-background-4.jpg",
      "author_id": "45",
      "description": "Lorem ipsum dolor sit amet...",
      "keywords": [
        "keyword 1", "keyword 2", "keyword 3"],
      'lines': []
    }
  }
  
    for(var i = 0; i < links.nodeDataArray.length; i++) {
       var line = 
           {
          "title": "",
          "text": "",
          "button_type": "",
          "buttons": '',
          "time": "",
          "next_line_title": ""
        };

        var data = links.nodeDataArray[i];

        line.text = data.text;
        line.title = data.key;

        var buttons = [];

        for (var j = 0; j < links.linkDataArray.length; j++) {
            var button = {
              "caption": "",
              "next_line_title": ""
            };

            var link = links.linkDataArray[j];
            if (link.from === line.title) {
              button.caption = link.text;
              button.next_line_title = link.to;
              buttons.push(button);
            }
        }

        if (buttons.length === 1) {
            line.button_type = 'next';
            line.time = buttons[0].caption;
            line.next_line_title = buttons[0].next_line_title;
        } else if (buttons.length === 2) {
            line.button_type = "button";
            line.buttons = buttons;
        } else if (buttons.length > 2) {
            line.button_type = "radio_button";
            line.buttons = buttons;
        } else {
            line.button_type = "end";
            line.buttons = buttons;
        }

        course.course.lines.push(line);
   }
  
  return course;
}

  function save() {
    
    var myJson = JSON.parse(myDiagram.model.toJson());  
    
    document.getElementById("mySavedModel").value = JSON.stringify(getCourse(myJson));
    myDiagram.isModified = false;
  }
  function load() {
    myDiagram.model = go.Model.fromJson('{ "class": "go.GraphLinksModel", "nodeDataArray": [ {"text":"Maybe finance seems very straightforward. ", "figure":"RoundedRectangle", "key":-1, "loc":"-513.0000000000001 -1286"}, {"text":"Revenue represents the value of the products sold or services rendered by a company during a specific period of time.", "figure":"RoundedRectangle", "key":-2, "loc":"-163.99999999999994 -826"}, {"text":"Let me explain why it\'s not.", "figure":"RoundedRectangle", "key":-3, "loc":"-460 -1076"}, {"text":"When do you think revenue is being recorded in a company\'s books", "figure":"RoundedRectangle", "key":-4, "loc":"-263.99999999999994 -1236.0000000000002"}, {"text":"That\'s not how it\'s done.", "figure":"RoundedRectangle", "key":-5, "loc":"432.99999999999994 -1346.0000000000005"}, {"text":"You would be right!", "figure":"RoundedRectangle", "key":-6, "loc":"291 -905"} ], "linkDataArray": [ {"from":-1, "to":-3, "visible":true, "points":[-513,-1259.1385762508462,-513,-1249.1385762508462,-513,-1181.0000000000002,-459.99999999999994,-1181.0000000000002,-459.99999999999994,-1112.8614237491543,-459.99999999999994,-1102.8614237491543], "text":"5000"}, {"from":-3, "to":-2, "visible":true, "points":[-369.238576250846,-1076.0000000000002,-359.238576250846,-1076.0000000000002,-312,-1076.0000000000002,-312,-826,-264.76142374915395,-826,-254.76142374915395,-826], "text":"5000"}, {"from":-2, "to":-4, "visible":true, "points":[-164,-884.061423749154,-164,-894.061423749154,-164,-1038.8,-264,-1038.8,-264,-1183.538576250846,-264,-1193.538576250846], "text":"5000"}, {"from":-4, "to":-5, "visible":true, "points":[-187.238576250846,-1236,-177.238576250846,-1236,276,-1236,276,-1346,347.23857625084605,-1346,357.23857625084605,-1346], "text":"When a contract is signed"}, {"from":-4, "to":-5, "visible":true, "points":[-187.238576250846,-1236,-177.238576250846,-1236,85.00000000000003,-1236,85.00000000000003,-1346,347.23857625084605,-1346,357.23857625084605,-1346], "text":" When the invoice is sent out "}, {"from":-4, "to":-6, "visible":true, "points":[-187.238576250846,-1236,-177.238576250846,-1236,12.028320312500028,-1236,12.028320312500028,-905,201.29521687584605,-905,211.29521687584605,-905], "text":"When the product or service is delivered"}, {"from":-4, "to":-5, "visible":true, "points":[-187.238576250846,-1236,-177.238576250846,-1236,-84,-1236,-84,-1346,347.23857625084605,-1346,357.23857625084605,-1346], "text":"When the bill is paid"} ]}');
  }
  // add an SVG rendering of the diagram at the end of this page
  function makeSVG() {
    var svg = myDiagram.makeSvg({
        scale: 0.5
      });
    svg.style.border = "1px solid black";
    obj = document.getElementById("SVGArea");
    obj.appendChild(svg);
    if (obj.children.length > 0) {
      obj.replaceChild(svg, obj.children[0]);
    }
  }