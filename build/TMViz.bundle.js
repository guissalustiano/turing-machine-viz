var TMViz =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp_name_"];
/******/ 	window["webpackJsonp_name_"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);
/******/ 		if(moreModules[0]) {
/******/ 			installedModules[0] = 0;
/******/ 			return __webpack_require__(0);
/******/ 		}
/******/ 	};
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// "0" means "already loaded"
/******/ 	// Array means "loading", array contains callbacks
/******/ 	var installedChunks = {
/******/ 		0:0
/******/ 	};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);
/******/
/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;
/******/
/******/ 			script.src = __webpack_require__.p + "" + chunkId + "." + ({"1":"main"}[chunkId]||chunkId) + ".bundle.js";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/build/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(10);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	module.exports = _;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	module.exports = d3;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	'use strict';
	// misc. utilities
	
	//////////////////////////////////
	// Utilities for null/undefined //
	//////////////////////////////////
	
	// Assert non-null.
	// Return the value if it is not null or undefined; otherwise, throw an error.
	function nonNull(value) {
	  if (value == null) {
	    throw new Error('expected a non-null defined value, but got: ' + String(value));
	  }
	  return value;
	}
	
	// Null coalescing: iff the first argument is null or undefined, return the second.
	function coalesce(a, b) {
	  return (a != null) ? a : b;
	}
	
	// Apply a function to a value if non-null, otherwise return the value.
	// (Monadic bind for maybe (option) type.)
	// ((a -> b), ?a) -> ?b
	function applyMaybe(f, x) {
	  return (x != null) ? f(x) : x;
	}
	
	// Returns the first function result that is not null or undefined.
	// Otherwise, returns undefined.
	// ((a -> ?b), [a]) -> ?b
	function getFirst(f, xs) {
	  for (var i = 0; i < xs.length; ++i) {
	    var val = f(xs[i]);
	    if (val != null) {
	      return val;
	    }
	  }
	}
	
	/////////
	// DOM //
	/////////
	
	/* global document */
	
	/**
	 * Concat an array of DOM Nodes into a DocumentFragment.
	 * @param  {[Node]} array
	 * @return {DocumentFragment}
	 */
	function toDocFragment(array) {
	  var result = document.createDocumentFragment();
	  array.forEach(result.appendChild.bind(result));
	  return result;
	}
	
	///////////////////////
	// IE/Edge detection //
	///////////////////////
	
	// http://stackoverflow.com/a/9851769
	var isBrowserIEorEdge = /*@cc_on!@*/false
	  || Boolean(document.documentMode) || Boolean(window.StyleMedia); // eslint-disable-line
	
	
	exports.nonNull = nonNull;
	exports.coalesce = coalesce;
	exports.applyMaybe = applyMaybe;
	exports.getFirst = getFirst;
	
	exports.toDocFragment = toDocFragment;
	
	exports.isBrowserIEorEdge = isBrowserIEorEdge;


/***/ }),
/* 4 */,
/* 5 */,
/* 6 */
/***/ (function(module, exports) {

	module.exports = lodash;

/***/ }),
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	/**
	 * Turing machine visualization component.
	 *
	 * • Adds running and reset on top of the base Turing machine.
	 * • Displays an animated state diagram and tape diagram.
	 * Does not include UI elements for controlling the machine.
	 *
	 * @module
	 */
	
	var TuringMachine = __webpack_require__(11).TuringMachine,
	    TapeViz = __webpack_require__(49),
	    StateGraph = __webpack_require__(46),
	    StateViz = __webpack_require__(47),
	    watchInit = __webpack_require__(16).watchInit,
	    d3 = __webpack_require__(2);
	
	/**
	 * Create an animated transition function.
	 * @param  {StateGraph} graph
	 * @param  {LayoutEdge -> any} animationCallback
	 * @return {(string, string) -> Instruction} Created transition function.
	 */
	function animatedTransition(graph, animationCallback) {
	  return function (state, symbol) {
	    var tuple = graph.getInstructionAndEdge(state, symbol);
	    if (tuple == null) { return null; }
	
	    animationCallback(tuple.edge);
	    return tuple.instruction;
	  };
	}
	
	/**
	 * Default edge animation callback.
	 * @param  {{domNode: Node}} edge
	 * @return {D3Transition} The animation. Use this for transition chaining.
	 */
	function pulseEdge(edge) {
	  var edgepath = d3.select(edge.domNode);
	  return edgepath
	      .classed('active-edge', true)
	    .transition()
	      .style('stroke-width', '3px')
	    .transition()
	      .style('stroke-width', '1px')
	    .transition()
	      .duration(0)
	      .each('start', /* @this edge */ function () {
	        d3.select(this).classed('active-edge', false);
	      })
	      .style('stroke', null)
	      .style('stroke-width', null);
	}
	
	function addTape(div, spec) {
	  return new TapeViz(div.append('svg').attr('class', 'tm-tape'), 9,
	    spec.blank, spec.input ? String(spec.input).split('') : []);
	}
	
	/**
	 * Construct a new state and tape visualization inside a &lt;div&gt;.
	 * @constructor
	 * @param {HTMLDivElement} div        div to take over and use.
	 * @param                  spec       machine specification
	 * @param {PositionTable} [posTable]  position table for the state nodes
	 */
	function TMViz(div, spec, posTable) {
	  div = d3.select(div);
	  var graph = new StateGraph(spec.table);
	  this.stateviz = new StateViz(
	    div,
	    graph.getVertexMap(),
	    graph.getEdges()
	  );
	  if (posTable != undefined) { this.positionTable = posTable; }
	
	  this.edgeAnimation = pulseEdge;
	  this.stepInterval = 100;
	
	  var self = this;
	  // We hook into the animation callback to know when to start the next step (when running).
	  function animateAndContinue(edge) {
	    var transition = self.edgeAnimation(edge);
	    if (self.isRunning) {
	      transition.transition().duration(self.stepInterval).each('end', function () {
	        // stop if machine was paused during the animation
	        if (self.isRunning) { self.step(); }
	      });
	    }
	  }
	
	  this.machine = new TuringMachine(
	    animatedTransition(graph, animateAndContinue),
	    spec.startState,
	    addTape(div, spec)
	  );
	  // intercept and animate when the state is set
	  watchInit(this.machine, 'state', function (prop, oldstate, newstate) {
	    d3.select(graph.getVertex(oldstate).domNode).classed('current-state', false);
	    d3.select(graph.getVertex(newstate).domNode).classed('current-state', true);
	    return newstate;
	  });
	
	  // Sidenote: each "Step" click evaluates the transition function once.
	  // Therefore, detecting halting always requires its own step (for consistency).
	  this.isHalted = false;
	
	  var isRunning = false;
	  /**
	   * Set isRunning to true to run the machine, and false to stop it.
	   */
	  Object.defineProperty(this, 'isRunning', {
	    configurable: true,
	    get: function () { return isRunning; },
	    set: function (value) {
	      if (isRunning !== value) {
	        isRunning = value;
	        if (isRunning) { this.step(); }
	      }
	    }
	  });
	
	  this.__parentDiv = div;
	  this.__spec = spec;
	}
	
	/**
	 * Step the machine immediately and interrupt any animations.
	 */
	TMViz.prototype.step = function () {
	  if (!this.machine.step()) {
	    this.isRunning = false;
	    this.isHalted = true;
	  }
	};
	
	/**
	 * Reset the Turing machine to its starting configuration.
	 */
	TMViz.prototype.reset = function () {
	  this.isRunning = false;
	  this.isHalted = false;
	  this.machine.state = this.__spec.startState;
	  this.machine.tape.domNode.remove();
	  this.machine.tape = addTape(this.__parentDiv, this.__spec);
	};
	
	Object.defineProperty(TMViz.prototype, 'positionTable', {
	  get: function ()  { return this.stateviz.positionTable; },
	  set: function (posTable) { this.stateviz.positionTable = posTable; }
	});
	
	module.exports = TMViz;


/***/ }),
/* 11 */
/***/ (function(module, exports) {

	'use strict';
	/**
	 * Construct a Turing machine.
	 * @param {(state, symbol) -> ?{state: state, symbol: symbol, move: direction}}
	 *   transition
	 *   A transition function that, given *only* the current state and symbol,
	 *   returns an object with the following properties: symbol, move, and state.
	 *   Returning null/undefined halts the machine (no transition defined).
	 * @param {state} startState  The state to start in.
	 * @param         tape        The tape to use.
	 */
	function TuringMachine(transition, startState, tape) {
	  this.transition = transition;
	  this.state = startState;
	  this.tape = tape;
	}
	
	TuringMachine.prototype.toString = function () {
	  return String(this.state) + '\n' + String(this.tape);
	};
	
	/**
	 * Step to the next configuration according to the transition function.
	 * @return {boolean} true if successful (the transition is defined),
	 *   false otherwise (machine halted)
	 */
	TuringMachine.prototype.step = function () {
	  var instruct = this.nextInstruction;
	  if (instruct == null) { return false; }
	
	  this.tape.write(instruct.symbol);
	  move(this.tape, instruct.move);
	  this.state = instruct.state;
	
	  return true;
	};
	
	Object.defineProperties(TuringMachine.prototype, {
	  nextInstruction: {
	    get: function () { return this.transition(this.state, this.tape.read()); },
	    enumerable: true
	  },
	  isHalted: {
	    get: function () { return this.nextInstruction == null; },
	    enumerable: true
	  }
	});
	
	// Allows for both notational conventions of moving the head or moving the tape
	function move(tape, direction) {
	  switch (direction) {
	    case MoveHead.right: tape.headRight(); break;
	    case MoveHead.left:  tape.headLeft();  break;
	    default: throw new TypeError('not a valid tape movement: ' + String(direction));
	  }
	}
	var MoveHead = Object.freeze({
	  left:  {toString: function () { return 'L'; } },
	  right: {toString: function () { return 'R'; } }
	});
	var MoveTape = Object.freeze({left: MoveHead.right, right: MoveHead.left});
	
	exports.MoveHead = MoveHead;
	exports.MoveTape = MoveTape;
	exports.TuringMachine = TuringMachine;


/***/ }),
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	/**
	 * Lightweight property assignment watching by overriding getters/setters.
	 * Intended as a bridge between plain JS properties and other libraries.
	 *
	 * Inspired by https://gist.github.com/eligrey/384583, which works for
	 * data properties only, this works for both data and accessor properties.
	 *
	 * 2015-11-21
	 * @author Andy Li
	 */
	
	/**
	 * Watches a property for assignment by overriding it with a getter & setter
	 * on top of the previous value or accessors.
	 *
	 * The handler can intercept assignments by returning a different value.
	 * Watching an unwritable/unsettable property does nothing, but trying to watch
	 * a non-existent or non-configurable property fails fast with TypeError.
	 * @param  {!Object} thisArg The object that contains the property.
	 * @param  {String}  prop    The name of the property to watch.
	 * @param            handler The function to call when the property is
	 *   assigned to. Important: this function intercepts assignment;
	 *   its return value is set as the new value.
	 * @throws {TypeError} if object is null or does not have the property
	 * @throws {TypeError} if thisArg.prop is non-configurable
	 * @return {?Object}         The previous property descriptor, or null if the
	 *   property is not writable/settable.
	 */
	function watch(thisArg, prop, handler) {
	  var desc = Object.getOwnPropertyDescriptor(thisArg, prop);
	  // check pre-conditions: existent, configurable, writable/settable
	  if (desc === undefined) {
	    throw new TypeError('Cannot watch nonexistent property \''+prop+'\'');
	  } else if (!desc.configurable) {
	    throw new TypeError('Cannot watch non-configurable property \''+prop+'\'');
	  } else if (!desc.writable && desc.set === undefined) {
	    return; // no-op since property can't change without reconfiguration
	  }
	
	  var accessors = (function () {
	    if (desc.set) {
	      // case: .get/.set
	      return {
	        get: desc.get,
	        set: function (newval) {
	          return desc.set.call(thisArg, handler.call(thisArg, prop, thisArg[prop], newval));
	        }
	      };
	    } else {
	      // case: .value
	      var val = desc.value;
	      return {
	        get: function () {
	          return val;
	        },
	        set: function (newval) {
	          return val = handler.call(thisArg, prop, val, newval);
	        }
	      };
	    }
	  })();
	  Object.defineProperty(thisArg, prop, accessors);
	
	  return desc;
	}
	
	/**
	 * {@link watch} that, if successful, also calls the handler once with
	 *   the current value (by setting it).
	 * @see watch
	 */
	function watchInit(thisArg, prop, handler) {
	  var value = thisArg[prop];
	  var desc = watch(thisArg, prop, handler);
	  if (desc) { thisArg[prop] = value; }
	  return desc;
	}
	
	if (true) {
	  exports.watch = watch;
	  exports.watchInit = watchInit;
	}


/***/ }),
/* 17 */,
/* 18 */,
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "state-diagram/StateViz.css";

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "tape/tape.css";

/***/ }),
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */,
/* 34 */,
/* 35 */,
/* 36 */,
/* 37 */,
/* 38 */,
/* 39 */,
/* 40 */,
/* 41 */,
/* 42 */,
/* 43 */,
/* 44 */,
/* 45 */,
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var _ = __webpack_require__(6);
	
	
	/* Interface
	  type TransitionTable = {
	    [state: string]: ?{
	      [symbol: string]: Instruction
	    }
	  };
	  type Instruction = { state?: string, symbol?: string };
	
	  type DiagramGraph = {
	    [state: string]: {
	      label: string,
	      transitions: ?{
	        [symbol: string]: {
	          instruction: Instruction,
	          edge: LayoutEdge
	        }
	      }
	    }
	  };
	  type LayoutEdge = { source: Object, target: Object, labels: [string] }
	 */
	
	/**
	 * Use a transition table to derive the graph (vertices & edges) for a D3 diagram.
	 * Edges with the same source and target are combined.
	 * NB. In addition to single symbols, comma-separated symbols are supported.
	 * e.g. symbol string '0,1,,,I' -> symbols [0,1,',','I'].
	 */
	// TransitionTable -> DiagramGraph
	function deriveGraph(table) {
	  // We need two passes, since edges may point at vertices yet to be created.
	  // 1. Create all the vertices.
	  var graph = _.mapValues(table, function (transitions, state) {
	    return {
	      label: state,
	      transitions: transitions
	    };
	  });
	  // 2. Create the edges, which can now point at any vertex object.
	  var allEdges = [];
	  _.forEach(graph, function (vertex, state) {
	
	    vertex.transitions = vertex.transitions && (function () {
	      var stateTransitions = {};
	
	      // Combine edges with the same source and target
	      var cache = {};
	      function edgeTo(target, label) {
	        var edge = cache[target] ||
	          _.tap(cache[target] = {
	            source: vertex,
	            target: graph[target],
	            labels: []
	          }, allEdges.push.bind(allEdges));
	        edge.labels.push(label);
	        return edge;
	      }
	      // Create symbol -> instruction object map
	      _.forEach(vertex.transitions, function (instruct, symbolKey) {
	        // Handle comma-separated symbols.
	        // Recreate array by splitting on ','. Treat 2 consecutive ',' as , ','.
	        var symbols = symbolKey.split(',').reduce(function (acc, x) {
	          if (x === '' && acc[acc.length-1] === '') {
	            acc[acc.length-1] = ',';
	          } else {
	            acc.push(x);
	          }
	          return acc;
	        }, []);
	        var target = instruct.state != null ? instruct.state : state;
	        var edge = edgeTo(target, labelFor(symbols, instruct));
	
	        symbols.forEach(function (symbol) {
	          stateTransitions[symbol] = {
	            // Normalize for execution, but display the less-cluttered original.
	            instruction: normalize(state, symbol, instruct),
	            edge: edge
	          };
	        });
	      });
	
	      return stateTransitions;
	    }());
	
	  });
	
	  return {graph: graph, edges: allEdges};
	}
	
	// Normalize an instruction to include an explicit state and symbol.
	// e.g. {symbol: '1'} normalizes to {state: 'q0', symbol: '1'} when in state q0.
	function normalize(state, symbol, instruction) {
	  return _.defaults({}, instruction, {state: state, symbol: symbol});
	}
	
	function labelFor(symbols, action) {
	  var rightSide = ((action.symbol == null) ? '' : (visibleSpace(String(action.symbol)) + ','))
	    + String(action.move);
	  return symbols.map(visibleSpace).join(',') + '→' + rightSide;
	}
	
	// replace ' ' with '␣'.
	function visibleSpace(c) {
	  return (c === ' ') ? '␣' : c;
	}
	
	
	/**
	 * Aids rendering and animating a transition table in D3.
	 *
	 * • Generates the vertices and edges ("nodes" and "links") for a D3 diagram.
	 * • Provides mapping of each state to its vertex and each transition to its edge.
	 * @param {TransitionTable} table
	 */
	function StateGraph(table) {
	  var derived = deriveGraph(table);
	  Object.defineProperties(this, {
	    __graph: { value: derived.graph },
	    __edges: { value: derived.edges }
	  });
	}
	
	/**
	 * D3 layout "nodes".
	 */
	// StateGraph.prototype.getVertices = function () {
	//   return _.values(this.__graph);
	// };
	
	/**
	 * Returns the mapping from states to vertices (D3 layout "nodes").
	 * @return { {[state: string]: Object} }
	 */
	StateGraph.prototype.getVertexMap = function () {
	  return this.__graph;
	};
	
	/**
	 * D3 layout "links".
	 */
	StateGraph.prototype.getEdges = function () {
	  return this.__edges;
	};
	
	/**
	 * Look up a state's corresponding D3 "node".
	 */
	StateGraph.prototype.getVertex = function (state) {
	  return this.__graph[state];
	};
	
	StateGraph.prototype.getInstructionAndEdge = function (state, symbol) {
	  var vertex = this.__graph[state];
	  if (vertex === undefined) {
	    throw new Error('not a valid state: ' + String(state));
	  }
	
	  return vertex.transitions && vertex.transitions[symbol];
	};
	
	
	module.exports = StateGraph;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var isBrowserIEorEdge = __webpack_require__(3).isBrowserIEorEdge;
	var d3 = __webpack_require__(2);
	var _ = __webpack_require__(1);
	var assign = __webpack_require__(6).assign; // need mutable assign()
	
	// *** Arrays as vectors ***
	
	// Add vectors.
	// Note: dimensions are not checked. Missing dimensions become NaN.
	function addV(array1, array2) {
	  return array1.map(function (x, i) { return x + array2[i]; });
	}
	
	function negateV(array) {
	  return array.map(function (x) { return -x; });
	}
	
	function subtractV(array1, array2) {
	  return addV(array1, negateV(array2));
	}
	
	// Scale the vector by a scalar.
	function multiplyV(array, scalar) {
	  return array.map(function (x) { return scalar*x; });
	}
	
	// Vector norm, squared
	function normSqV(array) {
	  function sq(x) { return x*x; }
	  function add(x, y) { return x + y; }
	  return array.map(sq).reduce(add, 0);
	}
	
	// Vector norm
	function normV(array) { return Math.sqrt(normSqV(array)); }
	
	// Return a copy of the vector rescaled as a unit vector (norm = 1).
	function unitV(array) {
	  var n = normV(array);
	  return array.map(function (x) { return x / n; });
	}
	
	// *** 2D Vectors ***
	function angleV(array) {
	  var x = array[0], y = array[1];
	  return Math.atan2(y, x);
	}
	
	function vectorFromLengthAngle(length, angle) {
	  return [Math.cos(angle) * length, Math.sin(angle) * length];
	}
	
	// *** Utilities ***
	
	// Count the directed edges that start at a given node and end at another.
	// Important: each node must have a unique .index property.
	// Example usage:
	// var counts = new EdgeCounter(edges);
	// var edgesFrom2To5 = counts.numEdgesFromTo(2,5);
	// var edgesFrom5to2 = counts.numEdgesFromTo(5,2);
	function EdgeCounter(edges) {
	  edges.forEach(function (e) {
	    var key = e.source.index +','+ e.target.index;
	    this[key] = (this[key] || 0) + 1;
	  }, this);
	}
	
	EdgeCounter.prototype.numEdgesFromTo = function (src, target) {
	  return this[String(src)+','+String(target)] || 0;
	};
	
	var EdgeShape = Object.freeze({
	  loop: {},     // self-loop: a->a
	  arc: {},      // curved arc: a->b when b->a exists
	  straight: {}  // straight edge: a->b when b->a does not exist
	});
	
	EdgeCounter.prototype.shapeForEdge = function (e) {
	  if (e.target.index === e.source.index) {
	    return EdgeShape.loop;
	  } else if (this.numEdgesFromTo(e.target.index, e.source.index)) {
	    // has returning edge => arc
	    return EdgeShape.arc;
	  } else {
	    return EdgeShape.straight;
	  }
	};
	
	// create a function that will compute an edge's SVG 'd' attribute.
	function edgePathFor(nodeRadius, shape, d) {
	  // case: self-loop
	  var loopEndOffset, loopArc;
	  if (shape === EdgeShape.loop) {
	    // start at the top (90°), end slightly above the right (15°)
	    loopEndOffset = vectorFromLengthAngle(nodeRadius, -15 * Math.PI/180);
	    loopArc = ' a 19,27 45 1,1 ' + loopEndOffset[0] + ',' + (loopEndOffset[1]+nodeRadius);
	    return function () {
	      var x1 = d.source.x,
	          y1 = d.source.y;
	      return 'M ' + x1 + ',' + (y1-nodeRadius) + loopArc;
	    };
	  }
	  // case: between nodes
	  if (shape === EdgeShape.arc) {
	    // sub-case: arc
	    return function () {
	      // note: p1 & p2 have to be delayed, to access x/y at the time of the call
	      var p1 = [d.source.x, d.source.y];
	      var p2 = [d.target.x, d.target.y];
	      var offset = subtractV(p2, p1);
	      var radius = 6/5*normV(offset);
	      // Note: SVG's y-axis is flipped, so vector angles are negative
	      // relative to standard coordinates (as used in Math.atan2).
	      // Proof: angle(r <cos ϴ, -sin ϴ>) = angle(r <cos -ϴ, sin -ϴ>) = -ϴ.
	      var angle = angleV(offset);
	      var sep = -Math.PI/2/2; // 90° separation, half on each side
	      var source = addV(p1, vectorFromLengthAngle(nodeRadius, angle+sep));
	      var target = addV(p2, vectorFromLengthAngle(nodeRadius, angle+Math.PI-sep));
	      // IDEA: consider http://www.w3.org/TR/SVG/paths.html#PathDataCubicBezierCommands
	      return (p1[0] <= p2[0])
	        ? 'M '+source[0]+' '+source[1]+' A '+radius+' '+radius+' 0 0,1 '+target[0]+' '+target[1]
	        : 'M '+target[0]+' '+target[1]+' A '+radius+' '+radius+' 0 0,0 '+source[0]+' '+source[1];
	    };
	  } else if (shape === EdgeShape.straight) {
	    return function () {
	      // sub-case: straight line
	      var p1 = [d.source.x, d.source.y];
	      var p2 = [d.target.x, d.target.y];
	      var offset = subtractV(p2, p1);
	      // avoid spurious errors when bounding causes node centers to coincide
	      if (offset[0] === 0 && offset[1] === 0) { return null; }
	
	      var target = subtractV(p2, multiplyV(unitV(offset), nodeRadius));
	      return 'M '+p1[0]+' '+p1[1]+' L '+ target[0] +' '+ target[1];
	    };
	  }
	}
	
	function rectCenter(svgrect) {
	  return {x: svgrect.x + svgrect.width/2,
	    y: svgrect.y + svgrect.height/2};
	}
	
	function identity(x) { return x; }
	function noop() {}
	
	function limitRange(min, max, value) {
	  return Math.max(min, Math.min(value, max));
	}
	
	// IE padding hack so that SVG resizes properly.
	// This works across browsers but we only need it for IE.
	var appendSVGTo = !isBrowserIEorEdge
	  ? function (div) { return div.append('svg'); }
	  : function (div, hwRatio) {
	    return div
	      .append('div')
	        .style({
	          width: '100%',
	          height: '0',
	          'padding-bottom': (100 * hwRatio) + '%',
	          position: 'relative'
	        })
	      .append('svg')
	        .style({
	          position: 'absolute',
	          top: '0',
	          left: '0'
	        });
	  };
	
	// *** D3 diagram ***
	__webpack_require__(19);
	
	// type LayoutNode = {label: string};
	// type StateMap = {[state: string]: LayoutNode};
	
	/**
	 * Create a state diagram inside an SVG.
	 * Each vertex/edge (node/link) object is also annotated with @.domNode@
	 * corresponding to its SVG element.
	 *
	 * Note: currently, element IDs (e.g. for textPath) will collide if multiple
	 * diagrams are on the same document (HTML page).
	 * @param  {D3Selection}      container     Container to add the SVG to.
	 * @param  {[LayoutNode] | StateMap} nodes  Parameter to D3's force.nodes.
	 *   Important: passing a StateMap is recommended when using setPositionTable.
	 *   Passing an array will key the state nodes by array index.
	 * @param  {[LayoutEdge]}     linkArray     Parameter to D3's force.links.
	 */
	function StateViz(container, nodes, linkArray) {
	  /* References:
	    [Sticky Force Layout](http://bl.ocks.org/mbostock/3750558) demonstrates
	    drag to position and double-click to release.
	
	    [Graph with labeled edges](http://bl.ocks.org/jhb/5955887) demonstrates
	    arrow edges with auto-rotated labels.
	  */
	
	  /* eslint-disable no-invalid-this */ // eslint is not familiar with D3
	  var w = 800;
	  var h = 500;
	  var linkDistance = 140;
	  var nodeRadius = 20;
	
	  var colors = d3.scale.category10();
	
	  var svg = appendSVGTo(container, h/w);
	  svg.attr({
	    'viewBox': [0, 0, w, h].join(' '),
	    'version': '1.1',
	    ':xmlns': 'http://www.w3.org/2000/svg',
	    ':xmlns:xlink': 'http://www.w3.org/1999/xlink'
	  });
	
	  // Force Layout
	
	  // drag event handlers
	  function dragstart(d) {
	    d.fixed = true;
	    svg.transition()
	      .style('box-shadow', 'inset 0 0 1px gold');
	  }
	  function dragend() {
	    svg.transition()
	      .style('box-shadow', null);
	  }
	  function releasenode(d) {
	    d.fixed = false;
	    force.resume();
	  }
	
	  // set up force layout
	  var nodeArray = nodes instanceof Array ? nodes : _.values(nodes);
	  this.__stateMap = nodes;
	
	  var force = d3.layout.force()
	      .nodes(nodeArray)
	      .links(linkArray)
	      .size([w,h])
	      .linkDistance([linkDistance])
	      .charge([-500])
	      .theta(0.1)
	      .gravity(0.05)
	      .start();
	
	  var drag = force.drag()
	      .on('dragstart', dragstart)
	      .on('dragend', dragend);
	
	  // Edges
	  var edgeCounter = new EdgeCounter(linkArray);
	
	  var edgeselection = svg.selectAll('.edgepath')
	    .data(linkArray)
	    .enter();
	
	  var edgegroups = edgeselection.append('g');
	
	  var labelAbove = function (d, i) { return String(-1.1*(i+1)) + 'em'; };
	  var labelBelow = function (d, i) { return String(0.6+ 1.1*(i+1)) + 'em'; };
	
	  edgegroups.each(function (edgeD, edgeIndex) {
	    var group = d3.select(this);
	    var edgepath = group
	      .append('path')
	        .attr({'class': 'edgepath',
	          'id': 'edgepath'+edgeIndex })
	        .each(function (d) { d.domNode = this; });
	
	    var labels = group.selectAll('.edgelabel')
	      .data(edgeD.labels).enter()
	      .append('text')
	        .attr('class', 'edgelabel');
	    labels.append('textPath')
	        .attr('xlink:href', function () { return '#edgepath'+edgeIndex; })
	        .attr('startOffset', '50%')
	        .text(identity);
	    /* To reduce JS computation, label positioning varies by edge shape:
	        * Straight edges can use a fixed 'dy' value.
	        * Loops cannot use 'dy' since it increases letter spacing
	          as labels get farther from the path. Instead, since a loop's shape
	          is fixed, it allows a fixed translate 'transform'.
	        * Arcs are bent and their shape is not fixed, so neither 'dy'
	          nor 'transform' can be constant.
	          Fortunately the curvature is slight enough that a fixed 'dy'
	          looks good enough without resorting to dynamic translations.
	    */
	    var shape = edgeCounter.shapeForEdge(edgeD);
	    edgeD.getPath = edgePathFor(nodeRadius, shape, edgeD);
	    switch (shape) {
	      case EdgeShape.straight:
	        labels.attr('dy', labelAbove);
	        edgeD.refreshLabels = function () {
	          // flip edge labels that are upside-down
	          labels.attr('transform', function () {
	            if (edgeD.target.x < edgeD.source.x) {
	              var c = rectCenter(this.getBBox());
	              return 'rotate(180 '+c.x+' '+c.y+')';
	            } else {
	              return null;
	            }
	          });
	        };
	        break;
	      case EdgeShape.arc:
	        var isFlipped;
	        edgeD.refreshLabels = function () {
	          var shouldFlip = edgeD.target.x < edgeD.source.x;
	          if (shouldFlip !== isFlipped) {
	            edgepath.classed('reversed-arc', shouldFlip);
	            labels.attr('dy', shouldFlip ? labelBelow : labelAbove);
	            isFlipped = shouldFlip;
	          }
	        };
	        break;
	      case EdgeShape.loop:
	        labels.attr('transform', function (d, i) {
	          return 'translate(' + String(8*(i+1)) + ' ' + String(-8*(i+1)) + ')';
	        });
	        edgeD.refreshLabels = noop;
	        break;
	    }
	  });
	  var edgepaths = edgegroups.selectAll('.edgepath');
	
	  // Nodes
	  // note: nodes are added after edges so as to paint over excess edge lines
	  var nodeSelection = svg.selectAll('.node')
	    .data(nodeArray)
	    .enter();
	
	  var nodecircles = nodeSelection
	    .append('circle')
	      .attr('class', 'node')
	      .attr('r', nodeRadius)
	      .style('fill', function (d,i) { return colors(i); })
	      .each(function (d) { d.domNode = this; })
	      .on('dblclick', releasenode)
	      .call(drag);
	
	  var nodelabels = nodeSelection
	   .append('text')
	     .attr('class', 'nodelabel')
	     .attr('dy', '0.25em') /* dy doesn't work in CSS */
	     .text(function (d) { return d.label; });
	
	  // Arrowheads
	  var svgdefs = svg.append('defs');
	  svgdefs.selectAll('marker')
	      .data(['arrowhead', 'active-arrowhead', 'reversed-arrowhead', 'reversed-active-arrowhead'])
	    .enter().append('marker')
	      .attr({'id': function (d) { return d; },
	        'viewBox':'0 -5 10 10',
	        'refX': function (d) {
	          return (d.lastIndexOf('reversed-', 0) === 0) ? 0 : 10;
	        },
	        'orient':'auto',
	        'markerWidth':10,
	        'markerHeight':10
	      })
	    .append('path')
	      .attr('d', 'M 0 -5 L 10 0 L 0 5 Z')
	      .attr('transform', function (d) {
	        return (d.lastIndexOf('reversed-', 0) === 0) ? 'rotate(180 5 0)' : null;
	      });
	
	  var svgCSS =
	    '.edgepath {' +
	    '  marker-end: url(#arrowhead);' +
	    '}' +
	    '.edgepath.active-edge {' +
	    '  marker-end: url(#active-arrowhead);' +
	    '}' +
	    '.edgepath.reversed-arc {' +
	    '  marker-start: url(#reversed-arrowhead);' +
	    '  marker-end: none;' +
	    '}' +
	    '.edgepath.active-edge.reversed-arc {' +
	    '  marker-start: url(#reversed-active-arrowhead);' +
	    '  marker-end: none;' +
	    '}';
	  svg.append('style').each(function () {
	    if (this.styleSheet) {
	      this.styleSheet.cssText = svgCSS;
	    } else {
	      this.textContent = svgCSS;
	    }
	  });
	
	  // Force Layout Update
	  force.on('tick', function () {
	    // Keep coordinates in bounds. http://bl.ocks.org/mbostock/1129492
	    // NB. Bounding can cause node centers to coincide, especially at corners.
	    nodecircles.attr({cx: function (d) { return d.x = limitRange(nodeRadius, w - nodeRadius, d.x); },
	      cy: function (d) { return d.y = limitRange(nodeRadius, h - nodeRadius, d.y); }
	    });
	
	    nodelabels.attr('x', function (d) { return d.x; })
	              .attr('y', function (d) { return d.y; });
	
	    edgepaths.attr('d', function (d) { return d.getPath(); });
	
	    edgegroups.each(function (d) { d.refreshLabels(); });
	
	    // Conserve CPU when layout is fully fixed
	    if (nodeArray.every(function (d) { return d.fixed; })) {
	      force.stop();
	    }
	  });
	  this.force = force;
	  /* eslint-enable no-invalid-this */
	}
	
	// Positioning
	
	// {[key: State]: Node} -> PositionTable
	var getPositionTable = _.mapValues(_.pick(['x', 'y', 'px', 'py', 'fixed']));
	
	// Tag nodes w/ positions. Mutates the node map.
	// PositionTable -> {[key: State]: Node} -> void
	function setPositionTable(posTable, stateMap) {
	  _.forEach(function (node, state) {
	    var position = posTable[state];
	    if (position !== undefined) {
	      assign(node, position);
	    }
	  }, stateMap);
	}
	
	Object.defineProperty(StateViz.prototype, 'positionTable', {
	  get: function () { return getPositionTable(this.__stateMap); },
	  set: function (posTable) {
	    setPositionTable(posTable, this.__stateMap);
	    // ensure that a cooled layout will update
	    this.force.resume();
	  }
	});
	
	
	module.exports = StateViz;


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	var _ = __webpack_require__(1);
	
	// Bidirectional infinite tape
	function Tape(blank, input) {
	  Object.defineProperty(this, 'blank', {
	    value: blank,
	    writable: false,
	    enumerable: true
	  });
	  // zipper data structure
	  // INVARIANTS: tape.before can be empty, tape.after must be nonempty.
	  // before: cells before the head (in order; left to right).
	  // after:  cells after and including the head (in reverse; right to left).
	  this.tape = {
	    before: [],
	    after: (input == null || input.length == 0) ? [blank] : input.slice().reverse(),
	    toString: function () {
	      return this.before.join('') + '🔎' + this.after.slice().reverse().join('');
	    }
	  };
	}
	
	// Read the value at the tape head.
	Tape.prototype.read = function () {
	  return _.last(this.tape.after);
	};
	Tape.prototype.write = function (symbol) {
	  this.tape.after[this.tape.after.length - 1] = symbol;
	};
	
	Tape.prototype.headRight = function () {
	  var before = this.tape.before,
	      after = this.tape.after;
	  before.push(after.pop());
	  if (_.isEmpty(after)) {
	    after.push(this.blank);
	  }
	};
	Tape.prototype.headLeft = function () {
	  var before = this.tape.before,
	      after = this.tape.after;
	  if (_.isEmpty(before)) {
	    before.push(this.blank);
	  }
	  after.push(before.pop());
	};
	
	Tape.prototype.toString = function () {
	  return this.tape.toString();
	};
	
	// for tape visualization. not part of TM definition.
	// Read the value at an offset from the tape head.
	// 0 is the tape head. + is to the right, - to the left.
	Tape.prototype.readOffset = function (i) {
	  var tape = this.tape;
	  if (i >= 0) {
	    // right side: offset [0..length-1] ↦ array index [length-1..0]
	    return (i <= tape.after.length - 1) ? tape.after[tape.after.length - 1 - i] : this.blank;
	  } else {
	    // left side: offset [-1..-length] ↦ array index [length-1..0]
	    return (i >= -tape.before.length) ? tape.before[tape.before.length + i] : this.blank;
	  }
	};
	
	// for tape visualization.
	// Read the values from an offset range (inclusive of start and end).
	Tape.prototype.readRange = function (start, end) {
	  return _.range(start, end+1).map(function (i) {
	    return this.readOffset(i);
	  }, this);
	};
	
	module.exports = Tape;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	var Tape = __webpack_require__(48),
	    d3   = __webpack_require__(2);
	__webpack_require__(20);
	
	var cellWidth = 50;
	var cellHeight = 50;
	
	function initTapeCells(selection) {
	  selection.attr('class', 'tape-cell');
	  selection.append('rect')
	      // the box outline is purely visual, so remove its data binding
	      .datum(null)
	      .attr({'width': cellWidth,
	        'height': cellHeight});
	  selection.append('text')
	      .text(function (d) { return d; })
	      .attr({'x': cellWidth/2, 'y': cellHeight/2 + 8});
	  return selection;
	}
	
	function positionCells(selection, offset) {
	  offset = (offset == null) ? 0 : offset;
	  selection.attr('transform', function (d, i) {
	    return 'translate(' + (-cellWidth+10 + cellWidth*(i+offset)) + ')';
	  });
	  return selection;
	}
	
	function repositionWrapper(wrapper) {
	  wrapper.attr('transform', 'translate(0 10)')
	    .transition()
	      .duration(0)
	    .select('.exiting')
	      .remove();
	}
	
	// Tape visualization centered around the tape head.
	function TapeViz(svg, lookaround, blank, input) {
	  Tape.call(this, blank, input);
	
	  Object.defineProperty(this, 'lookaround', {
	    value: lookaround,
	    writable: false,
	    enumerable: true
	  });
	  Object.defineProperty(this, 'domNode', {
	    value: svg,
	    writable: false,
	    enumerable: true
	  });
	
	  // width is before + head + after, trimming 2 off to show cut-off tape ends
	  var width  = cellWidth * (lookaround+1+lookaround-2) + 2*10;
	  var height = cellHeight + 2*10;
	  svg.attr({
	    'width': '95%',
	    'viewBox': [0, 0, width, height].join(' ')
	  });
	
	  this.wrapper = svg.append('g')
	      .attr('class', 'wrapper')
	      .call(repositionWrapper);
	
	  svg.append('rect')
	      .attr({'id': 'tape-head',
	        'width': (1+1/5) * cellWidth,
	        'height': (1+1/5) * cellHeight,
	        'x': -cellWidth+10/2 + cellWidth*lookaround,
	        'y': 10/2
	      });
	
	  this.wrapper.selectAll('.tape-cell')
	      .data(this.readRange(-lookaround, lookaround))
	    .enter()
	    .append('g')
	      .call(initTapeCells)
	      .call(positionCells)
	  ;
	}
	
	TapeViz.prototype = Object.create(Tape.prototype);
	TapeViz.prototype.constructor = TapeViz;
	
	// IDEA: chain headLeft/Right to wait for write()?
	TapeViz.prototype.write = function (symbol) {
	  // don't animate if symbol stays the same
	  if (Tape.prototype.read.call(this) === symbol) {
	    return;
	  }
	  Tape.prototype.write.call(this, symbol);
	
	  // remove leftover .exiting in case animation was interrupted
	  this.wrapper.selectAll('.exiting').remove();
	
	  d3.select(this.wrapper[0][0].childNodes[this.lookaround])
	      .datum(symbol)
	    .select('text')
	      .attr('fill-opacity', '1')
	      .attr('stroke-opacity', '1')
	    .transition()
	      .attr('fill-opacity', '0.4')
	      .attr('stroke-opacity', '0.1')
	    .transition()
	      .text(function (d) { return d; })
	      .attr('fill-opacity', '1')
	      .attr('stroke-opacity', '1')
	    .transition()
	      .duration(0)
	      .attr('fill-opacity', null)
	      .attr('stroke-opacity', null)
	    ;
	};
	
	function moveHead(wrapper, enter, exit, wOffset, cOffset) {
	  // add to one end
	  enter.call(initTapeCells);
	  // remove from the other end
	  exit.classed('exiting', true);
	  // translate cells forward, and the wrapper backwards
	  wrapper.selectAll('.tape-cell')
	      .call(positionCells, cOffset);
	  wrapper
	      .attr('transform', 'translate(' + (wOffset*cellWidth).toString() + ' 10)')
	    // animate wrapper returning to neutral position
	    .transition()
	      .call(repositionWrapper);
	}
	
	TapeViz.prototype.headRight = function () {
	  Tape.prototype.headRight.call(this);
	  // remove leftover .exiting in case animation was interrupted.
	  // Important: call-by-value evaluates the selection argument(s) of 'moveHead' before
	  // before entering the function, so exiting nodes have to be removed beforehand.
	  this.wrapper.selectAll('.exiting').remove();
	  moveHead(this.wrapper,
	    // add to right end
	    this.wrapper.append('g')
	        .datum(this.readOffset(this.lookaround)),
	    // remove from left end
	    this.wrapper.select('.tape-cell'),
	    1, -1);
	};
	
	TapeViz.prototype.headLeft = function () {
	  Tape.prototype.headLeft.call(this);
	  this.wrapper.selectAll('.exiting').remove();
	  moveHead(this.wrapper,
	    this.wrapper.insert('g', ':first-child')
	        .datum(this.readOffset(-this.lookaround)),
	    this.wrapper.select('.wrapper > .tape-cell:last-of-type'),
	    -1, 0);
	};
	
	module.exports = TapeViz;


/***/ })
/******/ ]);
//# sourceMappingURL=TMViz.bundle.js.map