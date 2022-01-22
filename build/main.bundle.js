var main =
webpackJsonp_name_([1],[
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	// main entry point for index.html.
	// important: make sure to coordinate variables and elements between the HTML and JS
	'use strict';
	
	/* eslint-env browser */
	var TMDocumentController = __webpack_require__(38),
	    DocumentMenu = __webpack_require__(37),
	    examples = __webpack_require__(12),
	    toDocFragment = __webpack_require__(3).toDocFragment;
	var ace = __webpack_require__(17);
	var $ = __webpack_require__(4); // for Bootstrap modal dialog events
	
	// load up front so going offline doesn't break anything
	// (for snippet placeholders, used by "New blank document")
	ace.config.loadModule('ace/ext/language_tools');
	
	function getId(id) { return document.getElementById(id); }
	
	function addAlertPane(type, html) {
	  getId('diagram-column').insertAdjacentHTML('afterbegin',
	    '<div class="alert alert-'+type+' alert-dismissible" role="alert">' +
	    '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>' +
	    html +
	    '</div>');
	}
	
	
	//////////////////////////
	// Compatibility Checks //
	//////////////////////////
	
	(function () {
	  // Warn when falling back to RAM-only storage
	  // NB. This mainly covers local storage errors and Safari's Private Browsing.
	  if (!__webpack_require__(7).canUseLocalStorage) {
	    addAlertPane('info', '<p>Local storage is unavailable. ' +
	      'Your browser could be in Private Browsing mode, or it might not support <a href="http://caniuse.com/#feat=namevalue-storage" target="_blank">local storage</a>.</p>' +
	      '<strong>Any changes will be lost after leaving the webpage.</strong>');
	  }
	
	  /*
	  Warn for IE 10 and under, which misbehave and lack certain features.
	  Examples:
	    • IE 9 and under don't support .classList.
	    • IE 10's "storage event is fired even on the originating document where it occurred."
	      http://caniuse.com/#feat=namevalue-storage
	  */
	
	  // Detect IE 10 and under (http://stackoverflow.com/a/16135889)
	  var isIEUnder11 = new Function('/*@cc_on return @_jscript_version; @*/')() < 11;
	  if (isIEUnder11) {
	    addAlertPane('warning',
	      '<p><strong>Your <a href="http://whatbrowser.org" target="_blank">web browser</a> is out of date</strong> and does not support some features used by this program.<br>' +
	      '<em>The page may not work correctly, and data may be lost.</em></p>' +
	      'Please update your browser, or use another browser such as <a href="http://www.google.com/chrome/browser/" target="_blank">Chrome</a> or <a href="http://getfirefox.com" target="_blank">Firefox</a>.');
	  }
	
	  // Warn about iOS local storage volatility
	  $(function () {
	    // Detect iOS (http://stackoverflow.com/a/9039885)
	    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	    if (isIOS) {
	      getId('misc-tips-list').insertAdjacentHTML('afterbegin',
	        '<li><strong class="text-warning">Important note for iOS</strong>: ' +
	        'iOS saves browser local storage in the cache folder, which is <strong>not backed up</strong>, and is ' +
	        '<q cite="https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#Browser_compatibility"><strong>subject to occasional clean up</strong>, ' +
	        'at the behest of the OS, typically if space is short.</q></li>');
	    }
	  });
	}());
	
	
	/////////////////////
	// Import & Export //
	/////////////////////
	
	function importDocument(obj) {
	  // duplicate data into the menu, then open it.
	  menu.duplicate(obj, {select: true, type: 'open'});
	}
	
	$(function () {
	  // Enable buttons now that handlers are ready
	  $('.tm-needsready').prop('disabled', false);
	
	  // Run import from URL query (if any)
	  var importArgs = {
	    dialogNode: getId('importDialog'),
	    importDocument: importDocument
	  };
	  __webpack_require__(15).runImport(importArgs);
	  // Init import dialog
	  var $importPanel = $('#importPanel');
	  $importPanel.one('show.bs.modal', function () {
	    __webpack_require__(45).init({
	      $dialog: $importPanel,
	      gistIDForm: getId('gistIDForm'),
	      importArgs: importArgs
	    });
	  });
	  // Init export dialog
	  var exportPanel = getId('exportPanel');
	  __webpack_require__(44).init({
	    $dialog: $(exportPanel),
	    getCurrentDocument: function () {
	      controller.save(); // IMPORTANT: save changes, otherwise data model is out of date
	      return menu.currentDocument;
	    },
	    getIsSynced: controller.getIsSynced.bind(controller),
	    gistContainer: getId('shareGistContainer'),
	    downloadContainer: getId('exportDownloadContainer'),
	    copyContentsButton: getId('copyContentsButton'),
	    textarea: exportPanel.querySelector('textarea')
	  });
	});
	
	
	///////////////////
	// Document List //
	///////////////////
	
	var menu = (function () {
	  var select = document.getElementById('tm-doc-menu');
	  // Group: Documents
	  var docGroup = document.createElement('optgroup');
	  docGroup.label = 'Documents';
	  select.appendChild(docGroup);
	  // Group: Examples
	  var exampleGroup = document.createElement('optgroup');
	  exampleGroup.label = 'Examples';
	  exampleGroup.appendChild(toDocFragment(examples.list.map(
	    DocumentMenu.prototype.optionFromDocument)));
	  select.appendChild(exampleGroup);
	
	  return new DocumentMenu({
	    menu: select,
	    group: docGroup,
	    storagePrefix: 'tm.docs',
	    firsttimeDocID: examples.firsttimeDocID
	  });
	})();
	
	
	/////////////////
	// "Edit" Menu //
	/////////////////
	
	(function () {
	  menu.onChange = function (doc, opts) {
	    switch (opts && opts.type) {
	      case 'duplicate':
	        controller.setBackingDocument(doc);
	        break;
	      case 'delete':
	        controller.forceLoadDocument(doc);
	        break;
	      default:
	        controller.openDocument(doc);
	    }
	    refreshEditMenu();
	  };
	
	  // Refresh the "Edit" menu items depending on document vs. example.
	  var refreshEditMenu = (function () {
	    var renameLink = document.querySelector('[data-target="#renameDialog"]');
	    var deleteLink = document.querySelector('[data-target="#deleteDialog"]');
	    var wasExample;
	    function renameExample() {
	      // duplicate, then rename the duplicate.
	      // how it works: switch to duplicate document ->
	      //   refreshEditMenu() enables rename dialog -> event bubbles up -> dialog opens.
	      // this might be the simplest way; Event.stopPropagation leaves the dropdown hanging.
	      duplicateDocument();
	    }
	
	    return function () {
	      var isExample = menu.currentDocument.isExample;
	      if (wasExample !== isExample) {
	        if (!isExample) {
	          renameLink.textContent = 'Rename…';
	          renameLink.removeEventListener('click', renameExample);
	          renameLink.setAttribute('data-toggle', 'modal');
	          deleteLink.textContent = 'Delete…';
	          deleteLink.setAttribute('data-target', '#deleteDialog');
	        } else {
	          renameLink.textContent = 'Rename a copy…';
	          renameLink.addEventListener('click', renameExample);
	          renameLink.removeAttribute('data-toggle');
	          deleteLink.textContent = 'Reset this example…';
	          deleteLink.setAttribute('data-target', '#resetExampleDialog');
	        }
	        wasExample = isExample;
	      }
	    };
	  }());
	  refreshEditMenu();
	
	  // only swap out the storage backing; don't affect views or undo history
	  function duplicateDocument() {
	    controller.save();
	    menu.duplicate(menu.currentDocument, {select: true});
	  }
	
	  function newBlankDocument() {
	    menu.newDocument({select: true});
	    // load up starter template
	    if (controller.editor.insertSnippet) { // async loaded
	      controller.editor.insertSnippet(examples.blankTemplate);
	      controller.loadEditorSource();
	    }
	  }
	
	  var $renameDialog = $(getId('renameDialog'));
	  [{id: 'tm-doc-action-duplicate', callback: duplicateDocument},
	  {id: 'tm-doc-action-newblank', callback: newBlankDocument}
	  ].forEach(function (item) {
	    document.getElementById(item.id).addEventListener('click', function (e) {
	      e.preventDefault();
	      item.callback(e);
	
	      $renameDialog.modal({keyboard: false})
	        .one('hidden.bs.modal', function () {
	          controller.editor.focus();
	        });
	    });
	  });
	}());
	
	
	/////////////
	// Dialogs //
	/////////////
	
	(function () {
	  // Rename
	  var $renameDialog = $(getId('renameDialog'));
	  var renameBox = getId('renameDialogInput');
	  $renameDialog
	    .on('show.bs.modal', function () {
	      renameBox.value = menu.currentOption.text;
	    })
	    .on('shown.bs.modal', function () {
	      renameBox.select();
	    })
	    // NB. remember data-keyboard="false" on the triggering element,
	    // to prevent closing with Esc and causing a save.
	    // remark: an exception thrown on 'hide' prevents the dialog from closing,
	    // so save during 'hidden' instead.
	    .on('hidden.bs.modal', function () {
	      var newName = renameBox.value;
	      if (menu.currentOption.text !== newName) {
	        menu.rename(newName);
	      }
	      renameBox.value = '';
	    });
	  document.getElementById('renameDialogForm').addEventListener('submit', function (e) {
	    e.preventDefault();
	    $renameDialog.modal('hide');
	  });
	
	  // Delete
	  function deleteDocument() {
	    menu.delete();
	  }
	  document.getElementById('tm-doc-action-delete').addEventListener('click', deleteDocument);
	
	  // Reset Example
	  function discardReset() {
	    menu.delete();
	    // load manually since example stays and selection doesn't change
	    controller.forceLoadDocument(menu.currentDocument);
	  }
	  function saveReset() {
	    menu.duplicate(menu.currentDocument, {select: false});
	    discardReset();
	  }
	  document.getElementById('tm-doc-action-resetdiscard').addEventListener('click', discardReset);
	  document.getElementById('tm-doc-action-resetsave').addEventListener('click', saveReset);
	}());
	
	////////////////
	// Controller //
	////////////////
	
	var controller = (function () {
	  function getButton(container, type) {
	    return container.querySelector('button.tm-' + type);
	  }
	  var editor = document.getElementById('editor-container');
	  // button containers
	  var sim = document.getElementById('controls-container');
	  var ed = editor.parentNode;
	
	  return new TMDocumentController({
	    simulator: document.getElementById('machine-container'),
	    editorAlerts: document.getElementById('editor-alerts-container'),
	    editor: editor
	  }, {
	    simulator: {
	      run: getButton(sim, 'run'),
	      step: getButton(sim, 'step'),
	      reset: getButton(sim, 'reset')
	    },
	    editor: {
	      load: getButton(ed, 'editor-load'),
	      export: getButton(ed, 'editor-export'),
	      revert: getButton(ed, 'editor-revert')
	    }
	  }, menu.currentDocument);
	}());
	
	controller.editor.setTheme('ace/theme/chrome');
	controller.editor.commands.addCommand({
	  name: 'save',
	  bindKey: { mac: 'Cmd-S', win: 'Ctrl-S' },
	  exec: function () {
	    controller.loadEditorSource();
	  }
	});
	controller.editor.session.setUseWrapMode(true);
	$(function () {
	  try {
	    __webpack_require__(41).main(controller.editor.commands,
	      getId('kbdShortcutTable')
	    );
	  } catch (e) {
	    /* */
	  }
	});
	
	window.addEventListener('beforeunload', function (ev) {
	  try {
	    controller.save();
	    menu.saveCurrentDocID();
	  } catch (error) {
	    addAlertPane('warning',
	      '<h4>The current document could not be saved.</h4>'+
	      '<p>It’s likely that the <a href="https://en.wikipedia.org/wiki/Web_storage#Storage_size" target="_blank">local storage quota</a> was exceeded. ' +
	      'Try downloading a copy of this document, then deleting other documents to make space.</p>');
	    return (ev || window.event).returnValue =
	      'There is not enough space left to save the current document.';
	  }
	});
	
	// Keep the current document in sync across tabs/windows
	window.addEventListener('blur', function () {
	  // One tab saves the data...
	  controller.save();
	});
	(function () {
	  // ...and the other tab loads it.
	  var isReloading = false;
	  __webpack_require__(9).addOutsideChangeListener(function (docID, prop) {
	    if (docID === controller.getDocument().id && prop !== 'name' && !isReloading) {
	      // Batch together property changes into one reload
	      isReloading = true;
	      setTimeout(function () {
	        isReloading = false;
	        // Preserve undo history
	        controller.forceLoadDocument(controller.getDocument(), true);
	
	      }, 100);
	    }
	  });
	}());
	
	// For interaction/debugging
	exports.controller = controller;


/***/ }),
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */
/***/ (function(module, exports) {

	module.exports = jQuery;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var jsyaml = __webpack_require__(18),
	    _ = __webpack_require__(1);
	
	// Document Serialization
	
	var docToYaml = {
	  name: 'name',
	  sourceCode: 'source code',
	  positionTable: 'positions',
	  editorSourceCode: 'editor contents'
	};
	var yamlToDoc = _.invert(docToYaml);
	
	// like _.mapKeys, but only using the keys specified in a mapping object.
	// {[key: string] -> string} -> ?Object -> Object
	function mapKeys(mapping) {
	  return function (input) {
	    var output = {};
	    if (input != null) {
	      Object.keys(mapping).forEach(function (fromKey) {
	        var toKey = mapping[fromKey];
	        output[toKey] = input[fromKey];
	      });
	    }
	    return output;
	  };
	}
	
	// we want parseDocument . stringifyDocument = identity, up to null == undefined.
	
	/**
	 * Serialize a document.
	 * For each state node position, only .x, .y, and .fixed are saved.
	 * .fixed is omitted if true (its default value).
	 * @param  {TMDocument} doc document to serialize
	 * @return {string}
	 */
	var stringifyDocument = _.flow(
	  mapKeys(docToYaml),
	  _.omitBy(function (x) { return x == null; }),
	  _.update('positions', _.mapValues(function (pos) {
	    return pos.fixed
	      ? {x: pos.x, y: pos.y}
	      : {x: pos.x, y: pos.y, fixed: false};
	  })),
	  // NB. lodash/fp/partialRight takes an array of arguments.
	  _.partialRight(jsyaml.safeDump, [{
	    flowLevel: 2,       // positions: one state per line
	    lineWidth: -1,      // don't wrap lines
	    noRefs: true,       // no aliases/references are used
	    noCompatMode: true  // use y: instead of 'y':
	  }])
	);
	
	/**
	 * Deserialize a document.
	 * State positions' .px and .py are optional and default to .x and .y.
	 * .fixed defaults to true.
	 * @param  {string} str    serialized document
	 * @return {Object}        data usable in TMDocument.copyFrom()
	 * @throws {YAMLException} on YAML syntax error
	 * @throws {TypeError}     when missing "source code" string property
	 */
	var parseDocument = _.flow(
	  jsyaml.safeLoad,
	  _.update('positions', _.mapValues(function (pos) {
	    // NB. lodash/fp/defaults is swapped: 2nd takes precedence
	    return _.defaults({px: pos.x, py: pos.y, fixed: true}, pos);
	  })),
	  mapKeys(yamlToDoc),
	  checkData
	);
	
	// throw if "source code" attribute is missing or not a string
	function checkData(obj) {
	  if (obj == null || obj.sourceCode == null) {
	    throw new InvalidDocumentError('The “source code:” value is missing');
	  } else if (!_.isString(obj.sourceCode)) {
	    throw new InvalidDocumentError('The “source code:” value needs to be of type string');
	  }
	  return obj;
	}
	
	// for valid YAML that is not valid as a document
	function InvalidDocumentError(message) {
	  this.name = 'InvalidDocumentError';
	  this.message = message || 'Invalid document';
	  this.stack = (new Error()).stack;
	}
	InvalidDocumentError.prototype = Object.create(Error.prototype);
	InvalidDocumentError.prototype.constructor = InvalidDocumentError;
	
	exports.stringifyDocument = stringifyDocument;
	exports.parseDocument = parseDocument;
	exports.InvalidDocumentError = InvalidDocumentError;
	
	// Re-exports
	exports.YAMLException = jsyaml.YAMLException;


/***/ }),
/* 6 */,
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var isBrowserIEorEdge = __webpack_require__(3).isBrowserIEorEdge;
	/* global localStorage:false, window:false */
	
	///////////////////////
	// Key-Value Storage //
	///////////////////////
	
	var canUseLocalStorage = (function () {
	  // from modernizr v3.3.1 (modernizr.com)
	  var mod = 'modernizr';
	  try {
	    localStorage.setItem(mod, mod);
	    localStorage.removeItem(mod);
	    return true;
	  } catch (e) {
	    return false;
	  }
	})();
	
	// RAM-only fallback
	var RAMStorage = (function () {
	  var obj = {};
	  return Object.freeze({
	    get length() { return Object.keys(obj).length; },
	    key: function (n) { return (n in Object.keys(obj)) ? Object.keys(obj)[n] : null; },
	    getItem: function (key) { return {}.hasOwnProperty.call(obj, key) ? obj[key] : null; },
	    setItem: function (key, val) { obj[key] = String(val); },
	    removeItem: function (key) { delete obj[key]; },
	    clear: function () { obj = {}; }
	  });
	})();
	
	var KeyValueStorage = (function () {
	  var s = canUseLocalStorage ? localStorage : RAMStorage;
	
	  // workaround IE/Edge firing events on its own window
	  var fromOwnWindow = isBrowserIEorEdge
	    ? function () { return window.document.hasFocus(); }
	    : function () { return false; };
	
	  return {
	    read  : s.getItem.bind(s),
	    write : s.setItem.bind(s),
	    remove: s.removeItem.bind(s),
	    // Registers a listener for StorageEvents from other tabs/windows.
	    addStorageListener: canUseLocalStorage
	      ? function (listener) {
	        window.addEventListener('storage', function (e) {
	          if (fromOwnWindow()) {
	            return;
	          }
	          if (e.storageArea === localStorage) {
	            listener(e);
	          }
	        });
	      }
	      : function () {},
	    removeStorageListener: canUseLocalStorage
	      ? window.removeEventListener.bind(window, 'storage')
	      : function () {}
	  };
	})();
	
	
	exports.canUseLocalStorage = canUseLocalStorage;
	exports.KeyValueStorage = KeyValueStorage;


/***/ }),
/* 8 */
/***/ (function(module, exports) {

	module.exports = Promise;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var KeyValueStorage = __webpack_require__(7).KeyValueStorage,
	    examples = __webpack_require__(12),
	    util = __webpack_require__(3),
	    _ = __webpack_require__(1);
	
	/**
	 * Document model (storage).
	 * @param {string} docID Each document ID in a key-value store should be unique.
	 *                       An ID is typically a timestamp. It should not contain '.'.
	 */
	function TMDocument(docID) {
	  var preset = examples.get(docID);
	  Object.defineProperties(this, {
	    id:     { value: docID },
	    prefix: { value: 'doc.' + docID },
	    isExample: { value: preset ? true : false }
	  });
	  // fall back to reading presets for example documents
	  if (preset) {
	    Object.defineProperties(this, {
	      sourceCode: useFallbackGet(preset, this, 'sourceCode'),
	      // names are read-only
	      positionTable: useFallbackGet(preset, this, 'positionTable'),
	      name: {
	        get: function () { return preset.name; },
	        set: function () {}, // don't err when removing (set = null)
	        enumerable: true
	      }
	    });
	  }
	}
	
	function useFallbackGet(preset, obj, prop) {
	  var proto = Object.getPrototypeOf(obj);
	  var desc = Object.getOwnPropertyDescriptor(proto, prop);
	  var get = desc.get;
	  desc.get = function () {
	    return util.coalesce(get.call(obj), preset[prop]);
	  };
	  return desc;
	}
	
	// internal method.
	TMDocument.prototype.path = function (path) {
	  return [this.prefix, path].join('.');
	};
	
	(function () {
	  var store = KeyValueStorage;
	  var read = store.read.bind(store);
	  var write = function (key, val) {
	    if (val != null) {
	      store.write(key, val);
	    } else {
	      store.remove(key);
	    }
	  };
	  // var remove = store.remove.bind(store);
	  function stringProp(path) {
	    return {
	      get: function () { return read(this.path(path)); },
	      set: function (val) { write(this.path(path), val); },
	      enumerable: true
	    };
	  }
	
	  var propDescriptors = {
	    sourceCode: stringProp('diagram.sourceCode'),
	    positionTable: {
	      get: function () {
	        return util.applyMaybe(parsePositionTable,
	          read(this.path('diagram.positions')));
	      },
	      set: function (val) {
	        write(this.path('diagram.positions'),
	          util.applyMaybe(stringifyPositionTable, val));
	      },
	      enumerable: true
	    },
	    editorSourceCode: stringProp('editor.sourceCode'),
	    name: stringProp('name')
	  };
	  Object.defineProperties(TMDocument.prototype, propDescriptors);
	  TMDocument.prototype.dataKeys = Object.keys(propDescriptors);
	})();
	
	// IDEA: bypass extra parse & stringify cycle for positions
	TMDocument.prototype.copyFrom = function (other) {
	  this.dataKeys.forEach(function (key) {
	    this[key] = other[key];
	  }, this);
	  return this;
	};
	
	TMDocument.prototype.delete = function () {
	  this.copyFrom({});
	};
	
	// Cross-tab/window storage sync
	
	/**
	 * Checks whether a storage key is for a document's name.
	 * @return {?string} The document ID if true, otherwise null.
	 */
	TMDocument.IDFromNameStorageKey = function (string) {
	  var result = /^doc\.([^.]+)\.name$/.exec(string);
	  return result && result[1];
	};
	
	/**
	 * Registers a listener for document changes caused by other tabs/windows.
	 * The listener receives the document ID and the property name that changed.
	 * @param {Function} listener
	 */
	TMDocument.addOutsideChangeListener = function (listener) {
	  var re = /^doc\.([^.]+)\.(.+)$/;
	
	  KeyValueStorage.addStorageListener(function (e) {
	    var matches = re.exec(e.key);
	    if (matches) {
	      listener(matches[1], matches[2]);
	    }
	  });
	};
	
	/////////////////////////
	// Position table JSON //
	/////////////////////////
	
	// JSON -> Object
	var parsePositionTable = JSON.parse;
	
	// PositionTable -> JSON
	var stringifyPositionTable = _.flow(
	  _.mapValues(truncateCoords(2)),
	  JSON.stringify
	);
	
	// Truncate .x .y .px .py to 2 decimal places, to save space.
	function truncateCoords(decimalPlaces) {
	  var multiplier = Math.pow(10, decimalPlaces);
	  function truncate(value) {
	    return Math.round(value * multiplier)/multiplier;
	  }
	
	  return function (val) {
	    var result =  _(val).pick(['x','y','px','py']).mapValues(truncate).value();
	    result.fixed = val.fixed;
	    return result;
	  };
	}
	
	module.exports = TMDocument;


/***/ }),
/* 10 */,
/* 11 */,
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var parseDocument = __webpack_require__(5).parseDocument;
	var fromPairs = __webpack_require__(1).fromPairs;
	
	
	function requireExample(name) {
	  return __webpack_require__(40)("./" + name + '.yaml');
	}
	
	var examplePairs = [
	  'repeat01',
	  'binaryIncrement',
	  'divisibleBy3',
	  'copy1s',
	  'divisibleBy3Base10',
	  'matchThreeLengths',
	  'matchBinaryStrings',
	  'palindrome',
	  'busyBeaver3',
	  'busyBeaver4',
	  'powersOfTwo',
	  'lengthMult',
	  'binaryAdd',
	  'unaryMult',
	  'binaryMult'
	].map(function (id) {
	  // parse each string into a document
	  var doc = parseDocument(requireExample(id));
	  doc.id = id;
	
	  return [id, doc];
	});
	var examples = Object.freeze(fromPairs(examplePairs));
	
	
	function isExampleID(docID) {
	  return {}.hasOwnProperty.call(examples, docID);
	}
	
	function get(docID) {
	  return isExampleID(docID) ? examples[docID] : null;
	}
	
	var list = examplePairs.map(function (pair) { return pair[1]; });
	
	
	exports.hasID = isExampleID;
	exports.get = get;
	exports.list = list;
	exports.firsttimeDocID = 'binaryIncrement';
	exports.blankTemplate = requireExample('_template');


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var TM = __webpack_require__(11),
	    jsyaml = __webpack_require__(18),
	    _ = __webpack_require__(6);
	
	/**
	 * Thrown when parsing a string that is valid as YAML but invalid
	 * as a machine specification.
	 *
	 * Examples: unrecognized synonym, no start state defined,
	 * transitioning to an undeclared state.
	 *
	 * A readable message is generated based on the details (if any) provided.
	 * @param {string} reason  A readable error code.
	 *   As an error code, this should be relatively short and not include runtime values.
	 * @param {?Object} details Optional details. Possible keys:
	 *                          problemValue, state, key, synonym, info, suggestion
	 */
	function TMSpecError(reason, details) {
	  this.name = 'TMSpecError';
	  this.stack = (new Error()).stack;
	
	  this.reason = reason;
	  this.details = details || {};
	}
	TMSpecError.prototype = Object.create(Error.prototype);
	TMSpecError.prototype.constructor = TMSpecError;
	
	// generate a formatted description in HTML
	Object.defineProperty(TMSpecError.prototype, 'message', {
	  get: function () {
	    var header = this.reason;
	    var details = this.details;
	
	    function code(str) { return '<code>' + str + '</code>'; }
	    function showLoc(state, symbol, synonym) {
	      if (state != null) {
	        if (symbol != null) {
	          return ' in the transition from state ' + code(state) + ' and symbol ' + code(symbol);
	        } else {
	          return ' for state ' + code(state);
	        }
	      } else if (synonym != null) {
	        return ' in the definition of synonym ' + code(synonym);
	      }
	      return '';
	    }
	    var problemValue = details.problemValue ? ' ' + code(details.problemValue) : '';
	    var location = showLoc(details.state, details.symbol, details.synonym);
	    var sentences = ['<strong>' + header + problemValue + '</strong>' + location
	      , details.info, details.suggestion]
	      .filter(_.identity)
	      .map(function (s) { return s + '.'; });
	    if (location) { sentences.splice(1, 0, '<br>'); }
	    return sentences.join(' ');
	  },
	  enumerable: true
	});
	
	// type TransitionTable = {[key: string]: ?{[key: string]: string} }
	// type TMSpec = {blank: string, start state: string, table: TransitionTable}
	
	// IDEA: check with flow (flowtype.org)
	// throws YAMLException on YAML syntax error
	// throws TMSpecError for an invalid spec (eg. no start state, transitioning to an undefined state)
	// string -> TMSpec
	function parseSpec(str) {
	  var obj = jsyaml.safeLoad(str);
	  // check for required object properties.
	  // auto-convert .blank and 'start state' to string, for convenience.
	  if (obj == null) { throw new TMSpecError('The document is empty',
	    {info: 'Every Turing machine requires a <code>blank</code> tape symbol,' +
	    ' a <code>start state</code>, and a transition <code>table</code>'}); }
	  var detailsForBlank = {suggestion:
	    'Examples: <code>blank: \' \'</code>, <code>blank: \'0\'</code>'};
	  if (obj.blank == null) {
	    throw new TMSpecError('No blank symbol was specified', detailsForBlank);
	  }
	  obj.blank = String(obj.blank);
	  if (obj.blank.length !== 1) {
	    throw new TMSpecError('The blank symbol must be a string of length 1', detailsForBlank);
	  }
	  obj.startState = obj['start state'];
	  delete obj['start state'];
	  if (obj.startState == null) {
	    throw new TMSpecError('No start state was specified',
	    {suggestion: 'Assign one using <code>start state: </code>'});
	  }
	  obj.startState = String(obj.startState);
	  // parse synonyms and transition table
	  checkTableType(obj.table); // parseSynonyms assumes a table object
	  var synonyms = parseSynonyms(obj.synonyms, obj.table);
	  obj.table = parseTable(synonyms, obj.table);
	  // check for references to non-existent states
	  if (!(obj.startState in obj.table)) {
	    throw new TMSpecError('The start state has to be declared in the transition table');
	  }
	
	  return obj;
	}
	
	function checkTableType(val) {
	  if (val == null) {
	    throw new TMSpecError('Missing transition table',
	    {suggestion: 'Specify one using <code>table:</code>'});
	  }
	  if (typeof val !== 'object') {
	    throw new TMSpecError('Transition table has an invalid type',
	      {problemValue: typeof val,
	        info: 'The transition table should be a nested mapping from states to symbols to instructions'});
	  }
	}
	
	// (any, Object) -> ?SynonymMap
	function parseSynonyms(val, table) {
	  if (val == null) {
	    return null;
	  }
	  if (typeof val !== 'object') {
	    throw new TMSpecError('Synonyms table has an invalid type',
	      {problemValue: typeof val,
	        info: 'Synonyms should be a mapping from string abbreviations to instructions'
	        + ' (e.g. <code>accept: {R: accept}</code>)'});
	  }
	  return _.mapValues(val, function (actionVal, key) {
	    try {
	      return parseInstruction(null, table, actionVal);
	    } catch (e) {
	      if (e instanceof TMSpecError) {
	        e.details.synonym = key;
	        if (e.reason === 'Unrecognized string') {
	          e.details.info = 'Note that a synonym cannot be defined using another synonym';
	        }
	      }
	      throw e;
	    }
	  });
	}
	
	// (?SynonymMap, {[key: string]: string}) -> TransitionTable
	function parseTable(synonyms, val) {
	  return _.mapValues(val, function (stateObj, state) {
	    if (stateObj == null) {
	      // case: halting state
	      return null;
	    }
	    if (typeof stateObj !== 'object') {
	      throw new TMSpecError('State entry has an invalid type',
	        {problemValue: typeof stateObj, state: state,
	          info: 'Each state should map symbols to instructions. An empty map signifies a halting state.'});
	    }
	    return _.mapValues(stateObj, function (actionVal, symbol) {
	      try {
	        return parseInstruction(synonyms, val, actionVal);
	      } catch (e) {
	        if (e instanceof TMSpecError) {
	          e.details.state = state;
	          e.details.symbol = symbol;
	        }
	        throw e;
	      }
	    });
	  });
	}
	
	// omits null/undefined properties
	// (?string, direction, ?string) -> {symbol?: string, move: direction, state?: string}
	function makeInstruction(symbol, move, state) {
	  return Object.freeze(_.omitBy({symbol: symbol, move: move, state: state},
	    function (x) { return x == null; }));
	}
	
	function checkTarget(table, instruct) {
	  if (instruct.state != null && !(instruct.state in table)) {
	    throw new TMSpecError('Undeclared state', {problemValue: instruct.state,
	      suggestion: 'Make sure to list all states in the transition table and define their transitions (if any)'});
	  }
	  return instruct;
	}
	
	// throws if the target state is undeclared (not in the table)
	// type SynonymMap = {[key: string]: TMAction}
	// (SynonymMap?, Object, string | Object) -> TMAction
	function parseInstruction(synonyms, table, val) {
	  return checkTarget(table, function () {
	    switch (typeof val) {
	      case 'string': return parseInstructionString(synonyms, val);
	      case 'object': return parseInstructionObject(val);
	      default: throw new TMSpecError('Invalid instruction type',
	        {problemValue: typeof val,
	          info: 'An instruction can be a string (a direction <code>L</code>/<code>R</code> or a synonym)'
	            + ' or a mapping (examples: <code>{R: accept}</code>, <code>{write: \' \', L: start}</code>)'});
	    }
	  }());
	}
	
	var moveLeft = Object.freeze({move: TM.MoveHead.left});
	var moveRight = Object.freeze({move: TM.MoveHead.right});
	
	// case: direction or synonym
	function parseInstructionString(synonyms, val) {
	  if (val === 'L') {
	    return moveLeft;
	  } else if (val === 'R') {
	    return moveRight;
	  }
	  // note: this order prevents overriding L/R in synonyms, as that would
	  // allow inconsistent notation, e.g. 'R' and {R: ..} being different.
	  if (synonyms && synonyms[val]) { return synonyms[val]; }
	  throw new TMSpecError('Unrecognized string',
	    {problemValue: val,
	      info: 'An instruction can be a string if it\'s a synonym or a direction'});
	}
	
	// type ActionObj = {write?: any, L: ?string} | {write?: any, R: ?string}
	// case: ActionObj
	function parseInstructionObject(val) {
	  var symbol, move, state;
	  if (val == null) { throw new TMSpecError('Missing instruction'); }
	  // prevent typos: check for unrecognized keys
	  (function () {
	    var badKey;
	    if (!Object.keys(val).every(function (key) {
	      badKey = key;
	      return key === 'L' || key === 'R' || key === 'write';
	    })) {
	      throw new TMSpecError('Unrecognized key',
	        {problemValue: badKey,
	          info: 'An instruction always has a tape movement <code>L</code> or <code>R</code>, '
	        + 'and optionally can <code>write</code> a symbol'});
	    }
	  })();
	  // one L/R key is required, with optional state value
	  if ('L' in val && 'R' in val) {
	    throw new TMSpecError('Conflicting tape movements',
	    {info: 'Each instruction needs exactly one movement direction, but two were found'});
	  }
	  if ('L' in val) {
	    move = TM.MoveHead.left;
	    state = val.L;
	  } else if ('R' in val) {
	    move = TM.MoveHead.right;
	    state = val.R;
	  } else {
	    throw new TMSpecError('Missing movement direction');
	  }
	  // write key is optional, but must contain a char value if present
	  if ('write' in val) {
	    var writeStr = String(val.write);
	    if (writeStr.length === 1) {
	      symbol = writeStr;
	    } else {
	      throw new TMSpecError('Write requires a string of length 1');
	    }
	  }
	  return makeInstruction(symbol, move, state);
	}
	
	exports.TMSpecError = TMSpecError;
	exports.parseSpec = parseSpec;
	// re-exports
	exports.YAMLException = jsyaml.YAMLException;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var $ = __webpack_require__(4);
	var Promise = __webpack_require__(8); // eslint-disable-line no-shadow
	
	Promise.config({
	  cancellation: true
	});
	
	// On success, 'resolve' is called with the response data.
	// On failure, 'reject' is called with {xhr: jqXHR, status: string, error: string}.
	// To abort the request, use .cancel (from bluebird). Neither is called in that case.
	// jqXHR -> Promise
	function promisifyAjax(xhr) {
	  return new Promise(function (resolve, reject, onCancel) {
	    xhr.then(resolve, function (jqXHR, textStatus, errorThrown) {
	      reject({xhr: jqXHR, status: textStatus, error: errorThrown});
	    });
	    onCancel && onCancel(function () {
	      try { xhr.abort(); } catch (e) {/* */}
	    });
	  });
	}
	
	// GistID -> Promise
	// @see promisifyAjax
	function getGist(gistID) {
	  return promisifyAjax($.ajax({
	    url: 'https://api.github.com/gists/' + gistID,
	    type: 'GET',
	    dataType: 'json',
	    accepts: 'application/vnd.github.v3+json' // specify API version for stability
	  }));
	}
	
	// https://developer.github.com/v3/gists/#create-a-gist
	// @see promisifyAjax
	// {files: {[filename: string]: {content: string}},
	//  description?: string, public?: boolean} -> Promise
	function createGist(payload) {
	  // return Promise.delay(1000, {id: 'offlinetesting'});
	  return promisifyAjax($.ajax({
	    url: 'https://api.github.com/gists',
	    type: 'POST',
	    data: JSON.stringify(payload),
	    // headers: {Authorization: 'token DEVTOKEN'},
	    dataType: 'json', // response datatype
	    accepts: 'application/vnd.github.v3+json' // specify API version for stability
	  }));
	}
	
	exports.getGist = getGist;
	exports.createGist = createGist;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	/* eslint-env browser */
	var CheckboxTable = __webpack_require__(42);
	var FileReaderPromise = __webpack_require__(43);
	var format = __webpack_require__(5);
	var getGist = __webpack_require__(14).getGist;
	
	var $ = __webpack_require__(4);
	var _ = __webpack_require__(1);
	var d3 = __webpack_require__(2);
	var Promise = __webpack_require__(8);  // eslint-disable-line no-shadow
	
	
	function decodeFormURLComponent(str) {
	  return decodeURIComponent(str.replace('+', ' '));
	}
	
	/**
	 * https://url.spec.whatwg.org/#urlencoded-parsing
	 */
	function queryParams(queryString) {
	  function decode(str) {
	    return str ? decodeFormURLComponent(str) : '';
	  }
	  var result = {};
	  queryString.split('&').forEach(function (str) {
	    var pair = str.split('=');
	    result[decode(pair[0])] = decode(pair[1]);
	  });
	  return result;
	}
	
	///////////////////
	// Import Dialog //
	///////////////////
	
	// requires an existing dialog in the DOM
	function ImportDialog(dialogNode) {
	  this.node = dialogNode;
	  this.titleNode = dialogNode.querySelector('.modal-header .modal-title');
	  this.bodyNode = dialogNode.querySelector('.modal-body');
	  this.footerNode = dialogNode.querySelector('.modal-footer');
	  this.cancelButtonNode = d3.select(this.footerNode).text('')
	    .append('button')
	      .attr({type: 'button', class: 'btn btn-default', 'data-dismiss': 'modal'})
	      .text('Cancel')
	    .node();
	  this.$dialog = $(dialogNode)
	    .one('hide.bs.modal', this.__onClose.bind(this));
	}
	
	// internal event handler.
	ImportDialog.prototype.__onClose = function () {
	  this.onClose();
	  // use .empty to clean up $.on used in CheckboxTable
	  $(this.bodyNode).empty();
	  $(this.footerNode).empty();
	};
	
	// configurable
	ImportDialog.prototype.onClose = function () {
	};
	
	ImportDialog.prototype.show = function () {
	  this.$dialog.modal({backdrop: 'static', keyboard: false});
	};
	
	ImportDialog.prototype.close = function () {
	  this.$dialog.modal('hide');
	};
	
	ImportDialog.prototype.setBodyChildNodes = function (nodes) {
	  this.bodyNode.textContent = '';
	  this.bodyNode.appendChild(joinNodes(nodes));
	};
	
	function appendPanel(div, titleHTML) {
	  var panel = div.append('div')
	      .attr('class', 'panel panel-default');
	  panel.append('div')
	      .attr('class', 'panel-heading')
	    .append('h5')
	      .attr('class', 'panel-title')
	      .html(titleHTML);
	  return panel;
	}
	
	var emptySelection = Object.freeze(d3.selectAll([]));
	
	// (D3Selection, {title: string, data: [string]}) -> void
	function appendListPanel(container, data) {
	  var panel = emptySelection;
	  if (data.data && data.data.length) {
	    panel = appendPanel(container, data.title);
	    panel.append('div')
	        .attr('class', 'panel-body')
	      .append('ul')
	        .attr('class', 'list-inline')
	      .selectAll('li')
	        .data(data.data)
	      .enter().append('li')
	        .text(_.identity);
	  }
	  return panel;
	}
	
	// ( D3Selection, {title: string, headers: [string],
	//  data: [[string | (D3Selection -> void)]]} ) -> void
	function appendTablePanel(container, data) {
	  var panel = emptySelection;
	  if (data.data && data.data.length) {
	    panel = appendPanel(container, data.title);
	    panel.append('table')
	        .attr('class', 'table')
	        .call(function (table) {
	          // headers
	          table.append('thead')
	            .append('tr').selectAll('th').data(data.headers)
	            .enter().append('th').text(_.identity);
	          // contents
	          table.append('tbody').selectAll('tr')
	              .data(data.data)
	            .enter().append('tr').selectAll('td')
	              .data(_.identity)
	            .enter().append('td').each(/* @this td */ function (d) {
	              var td = d3.select(this);
	              if (typeof d === 'function') {
	                d(td);
	              } else {
	                td.text(d);
	              }
	            });
	        });
	  }
	  return panel;
	}
	
	// NonDocumentFiles -> boolean
	var isEmptyNonDocs = _.every(_.isEmpty);
	
	// (D3Selection, NonDocumentFiles, ?string) -> void
	function listNondocuments(dialogBody, nondocs, disclosureTitle) {
	  if (isEmptyNonDocs(nondocs)) {
	    return;
	  }
	  // Disclosure triangle
	  var collapseId = 'nondocument-files';
	  dialogBody.append('a')
	      .attr({
	        href: '#'+collapseId,
	        class: 'disclosure-triangle collapsed',
	        role: 'button',
	        'data-toggle': 'collapse'
	      })
	      .text(disclosureTitle ? disclosureTitle : 'Show other files');
	  var container = dialogBody.append('div')
	      .attr({
	        id: collapseId,
	        class: 'collapse'
	      });
	  // Errors by type, most important first
	  appendTablePanel(container, {
	    title: 'Unexpected error',
	    headers: ['Filename', 'Error'],
	    data: nondocs.otherError.map(function functionName(d) {
	      return [d.filename, errorString(d.error) ];
	    })
	  }).classed('panel-danger', true);
	  appendTablePanel(container, {
	    title: 'Not suitable for import',
	    headers: ['Filename', 'Reason'],
	    data: nondocs.badDoc.map(function (d) {
	      return [d.filename, d.error.message];
	    })
	  });
	  appendTablePanel(container, {
	    title: 'Not valid as YAML',
	    headers: ['Filename', 'Syntax error'],
	    data: nondocs.badYAML.map(function (d) {
	      return [d.filename,
	        function (td) { td.append('pre').text(d.error.message); } ];
	    })
	  });
	  // TODO: document largest allowed filesize; limit export likewise
	  appendListPanel(container, {
	    title: 'File is too large',
	    data: nondocs.tooLarge
	  });
	  appendListPanel(container, {
	    title: 'Different file extension (not <code>.yaml</code>/<code>.yml</code>)',
	    data: nondocs.wrongType
	  });
	}
	
	// deal with objects like DOMError (whose .toString gives "[object FileError]")
	function errorString(reason) {
	  return reason instanceof Error
	    ? String(reason)
	    : reason.message || reason.name || String(reason);
	}
	
	//////////////////////
	// Document Parsing //
	//////////////////////
	
	/* Interface for Document Parsing
	  type GistFile = {
	    filename: string,
	    size: number,
	    truncated: boolean,
	    content: string
	  };
	  type TMData = {source code: string};
	  type DocFile = {filename: string, size: number, document: TMData};
	
	  type Filename = string;
	  type ErrorTuple = {filename: Filename, error: Error | YAMLException};
	  type NonDocumentFiles = {
	    wrongType:  [Filename],
	    tooLarge:   [Filename],
	    badYAML:    [ErrorTuple],
	    badDoc:     [ErrorTuple],
	    otherError: [ErrorTuple]
	  };
	  type ParseResult = {documentFiles: [DocFile], nonDocumentFiles: NonDocumentFiles};
	 */
	
	// Parse each file into a document or a categorized error.
	// Local files are read only if they have the right extension and size.
	// NB. make sure to convert FileList to an actual Array.
	// The promise resolves with ParseResult.
	// (number, [GistFile | File]) -> Promise
	function parseFiles(sizelimit, files) {
	  var docfiles = [];
	  var nondocs = {wrongType: [], tooLarge: [], badYAML: [], badDoc: [], otherError: []};
	
	  return Promise.each(files, function (file) {
	    var name = file.filename || file.name; // eslint-disable-line no-shadow
	    if (name.search(/\.ya?ml$/) === -1) {
	      nondocs.wrongType.push(name);
	    } else if (file.truncated || file.size > sizelimit) {
	      nondocs.tooLarge.push(name);
	    } else {
	      return Promise.resolve(file.content != null ? file.content
	        : FileReaderPromise.readAsText(file))
	      .then(function (content) {
	        docfiles.push({
	          filename: name,
	          size: file.size,
	          document: format.parseDocument(content)
	        });
	      }).catch(function (e) {
	        var tuple = {filename: name, error: e};
	        if (e instanceof format.YAMLException) {
	          nondocs.badYAML.push(tuple);
	        } else if (e instanceof format.InvalidDocumentError) {
	          nondocs.badDoc.push(tuple);
	        } else {
	          nondocs.otherError.push(tuple);
	        }
	      });
	    }
	  }).return({documentFiles: docfiles, nonDocumentFiles: nondocs});
	}
	
	/////////////////////
	// Document Import //
	/////////////////////
	
	function showSizeKB(n) {
	  // example: 12.0 KB
	  return (Math.ceil(10*n/1024)/10).toFixed(1) + ' KB';
	}
	
	// {docFiles: [DocFile], nonDocumentFiles: NonDocumentFiles,
	//  dialog: ImportDialog, citeNode?: Node, importDocuments: [TMData] -> void} -> void
	function pickMultiple(args) {
	  var docfiles = args.documentFiles,
	      nondocs = args.nonDocumentFiles,
	      citeNode = args.citeNode,
	      dialog = args.dialog,
	      importDocuments = args.importDocuments;
	  // Dialog body
	  var dialogBody = d3.select(dialog.bodyNode).text('');
	  dialogBody.append('p').call(function (p) {
	    p.append('strong').text('Select documents to import');
	    if (citeNode) {
	      p.node().appendChild(document.createTextNode(' from '));
	      p.node().appendChild(citeNode);
	    }
	  });
	  var ctable = new CheckboxTable({
	    table: dialogBody.append('table')
	      .attr({class: 'table table-hover checkbox-table'}),
	    headers: ['Filename', 'Size'],
	    data: docfiles.map(function (doc) {
	      return [doc.filename, showSizeKB(doc.size)];
	    })
	  });
	  listNondocuments(dialogBody, nondocs);
	  // Dialog footer
	  var importButton = d3.select(dialog.footerNode).append('button')
	      .attr({type: 'button', class: 'btn btn-primary', 'data-dismiss': 'modal'})
	      .property('disabled', true)
	      .text('Import')
	      .on('click', /* @this button */ function () {
	        d3.select(this).on('click', null); // prevent double import; like .one()
	        var names = d3.set(ctable.getCheckedValues());
	        importDocuments(docfiles
	          .filter(function (file) { return names.has(file.filename); })
	          .map(_.property('document'))
	        );
	      })
	    .node();
	  ctable.onChange = function () {
	    importButton.disabled = ctable.isCheckedEmpty();
	  };
	}
	
	// {nonDocumentFiles: NonDocumentFiles, dialog: ImportDialog, citeLink?: Node} -> void
	function pickNone(args) {
	  var nondocs = args.nonDocumentFiles,
	      dialog = args.dialog,
	      citeLink = args.citeLink;
	
	  d3.select(dialog.bodyNode).text('').call(function (body) {
	    body.append('p').append('strong').text(!isEmptyNonDocs(nondocs)
	        ? 'None of the files are suitable for import.'
	        : 'No files were selected.');
	    if (citeLink) {
	      body.append('p').text('Requested URL: ').node().appendChild(citeLink);
	    }
	    listNondocuments(body, nondocs, 'Show details');
	  });
	  dialog.cancelButtonNode.textContent = 'Close';
	}
	
	// Intermingle text and nodes.
	// [Node | string] -> DocumentFragment
	function joinNodes(nodes) {
	  var result = document.createDocumentFragment();
	  nodes.forEach(function (node) {
	    if (typeof node === 'string') {
	      result.appendChild(document.createTextNode(node));
	    } else {
	      result.appendChild(node);
	    }
	  });
	  return result;
	}
	
	function wrapTag(tagName, node) {
	  var tag = document.createElement(tagName);
	  tag.appendChild(node);
	  return tag;
	}
	
	// Create a link with text <q>`gist description`</q> if given, otherwise gist `gistID`.
	// {gistID: string, description?: string} -> HTMLAnchorElement | HTMLQuoteElement
	function gistDescriptionLink(args) {
	  var link = externalLink({
	    href: 'https://gist.github.com/' + args.gistID,
	    textContent: args.description || ('gist ' + args.gistID)
	  });
	  return args.description ? wrapTag('q', link) : link;
	}
	
	// {href: string, textContent?: string} -> HTMLAnchorElement
	function externalLink(args) {
	  var link = document.createElement('a');
	  link.href = args.href;
	  link.target = '_blank';
	  link.textContent = args.textContent || args.href;
	  return link;
	}
	
	// The returned promise resolves/cancels when the dialog is closed:
	// • resolves if loading (before import) finished and the user cancelled anyway
	// • cancels if files were still loading and not yet displayed (eg. fetch, parse)
	// ({gistID: string, dialogNode: Node, importDocument: TMData -> void} |
	// {files: FileList, dialogNode: Node, importDocument: TMData -> void}) -> Promise
	function importCommon(args) {
	  var gistID = args.gistID,
	      dialogNode = args.dialogNode,
	      importDocument = args.importDocument;
	
	  var dialog = new ImportDialog(dialogNode);
	  var citeLink;
	  var citeNode;
	  // prevent accidentally exceeding quota
	  var MAX_FILESIZE = 400 * 1024;
	  // Start fetch, show dialog
	  var filesPromise = (function () {
	    if (gistID != null) {
	      dialog.titleNode.textContent = 'Import from GitHub gist';
	      citeLink = externalLink({href: 'https://gist.github.com/' + gistID});
	      dialog.setBodyChildNodes(['Retrieving ', citeLink, '…']);
	      return getGist(gistID).then(function (data) {
	        citeNode = gistDescriptionLink({
	          gistID: gistID,
	          description: data.description
	        });
	        dialog.setBodyChildNodes(['Processing ', citeLink, '…']);
	        return _.values(data.files);
	      });
	    } else {
	      dialog.titleNode.textContent = 'Import from files';
	      dialog.setBodyChildNodes(['Processing files…']);
	      return Promise.resolve(_.toArray(args.files));
	    }
	  }());
	  dialog.show();
	  // Parse, pick, import
	  var promise = filesPromise
	  .then(parseFiles.bind(undefined, MAX_FILESIZE))
	  .then(function (parsed) {
	    var docfiles = parsed.documentFiles;
	    switch (docfiles.length) {
	      case 0:
	        pickNone({
	          nonDocumentFiles: parsed.nonDocumentFiles,
	          dialog: dialog,
	          citeLink: citeLink
	        });
	        return;
	      case 1:
	        importDocument(docfiles[0].document);
	        dialog.close();
	        return;
	      default:
	        pickMultiple({
	          documentFiles: docfiles,
	          nonDocumentFiles: parsed.nonDocumentFiles,
	          dialog: dialog,
	          citeNode: citeNode,
	          importDocuments: function importDocuments(docs) {
	            docs.concat().reverse().map(importDocument);
	          }
	        });
	    }
	  })
	  .catch(function (reason) {
	    dialog.setBodyChildNodes([messageForError(reason)]
	      .concat(citeLink ? ['Requested URL: ', citeLink] : [])
	    );
	    dialog.cancelButtonNode.textContent = 'Close';
	  });
	  var waitForDialog = new Promise(function (resolve) {
	    dialog.onClose = function () {
	      promise.cancel();
	      resolve();
	    };
	  });
	  return promise.return(waitForDialog);
	}
	
	// {gistID: string, dialogNode: Node, importDocument: TMData -> void} -> Promise
	var importGist = importCommon;
	
	// {files: FileList, dialogNode: Node, importDocument: TMData -> void} -> Promise
	var importLocalFiles = importCommon;
	
	function createElementHTML(tagName, innerHTML) {
	  var element = document.createElement(tagName);
	  element.innerHTML = innerHTML;
	  return element;
	}
	
	// ({xhr: jqXHR} | Error) -> Node
	function messageForError(reason) {
	  var xhr = reason.xhr;
	  if (xhr) {
	    // case: couldn't fetch
	    return createElementHTML('p', (function () {
	      switch (reason.status) {
	        case 'abort':
	          return [''];
	        case 'timeout':
	          return [
	            '<strong>The request timed out.</strong>',
	            'You can check your connection and try again.'
	          ];
	        default:
	        // case: HTTP error
	          if (xhr.status === 404) {
	            return [
	              '<strong>No GitHub gist exists with that ID.</strong>',
	              'It’s possible the ID is incorrect, or the gist was deleted.'
	            ];
	          } else if (xhr.status === 0) {
	            return ['GitHub could not be reached. Your Internet connection may be offline.'];
	          } else {
	            return [
	              'The import failed because of a <strong>connection error</strong>.',
	              'HTTP status code: ' + xhr.status + ' ' + xhr.statusText
	            ];
	          }
	      }
	    }()).join('<br>'));
	  } else {
	    // case: other error
	    var pre = document.createElement('pre');
	    pre.textContent = errorString(reason);
	    return joinNodes([
	      createElementHTML('p', 'An unexpected error occurred:'), pre]);
	  }
	}
	
	// Import a gist via ?import-gist=gistID and remove the query string from the URL.
	// Call this once the DOM is ready (document.readyState === 'interactive').
	// {dialogNode: Node, importDocument: TMData -> void} -> void
	function runImport(args) {
	  function removeQuery() {
	    try {
	      history.replaceState(null, null, location.pathname);
	    } catch (e) {
	      // ignore
	    }
	  }
	
	  var params = queryParams(location.search.substring(1));
	  var gistID = params['import-gist'];
	  if (gistID) {
	    importGist(_.assign({gistID: gistID}, args))
	    .finally(removeQuery);
	  }
	}
	
	exports.importGist = importGist;
	exports.importLocalFiles = importLocalFiles;
	exports.runImport = runImport;


/***/ }),
/* 16 */,
/* 17 */
/***/ (function(module, exports) {

	module.exports = ace;

/***/ }),
/* 18 */
/***/ (function(module, exports) {

	module.exports = jsyaml;

/***/ }),
/* 19 */,
/* 20 */,
/* 21 */
/***/ (function(module, exports) {

	module.exports = "input: '${2}'\nblank: '${3: }'\nstart state: ${4:start}\ntable:\n  ${4}:\n    ${5}\n"

/***/ }),
/* 22 */
/***/ (function(module, exports) {

	module.exports = "name: binary addition\nsource code: |\n  # Adds two binary numbers together.\n\n  # Format: Given input a+b where a and b are binary numbers,\n  # leaves c b on the tape, where c = a+b.\n  # Example: '11+1' => '100 1'.\n  input: '1011+11001'\n  blank: ' '\n  start state: right\n  table:\n    # Start at the second number's rightmost digit.\n    right:\n      [0,1,+]: R\n      ' ': {L: read}\n\n    # Add each digit from right to left:\n    # read the current digit of the second number,\n    read:\n      0: {write: c, L: have0}\n      1: {write: c, L: have1}\n      +: {write: ' ', L: rewrite}\n    # and add it to the next place of the first number,\n    # marking the place (using O or I) as already added.\n    have0: {[0,1]: L, +: {L: add0}}\n    have1: {[0,1]: L, +: {L: add1}}\n    add0:\n      [0,' ']: {write: O, R: back0}\n      1      : {write: I, R: back0}\n      [O,I]  : L\n    add1:\n      [0,' ']: {write: I, R: back1}\n      1      : {write: O, L: carry}\n      [O,I]  : L\n    carry:\n      [0,' ']: {write: 1, R: back1}\n      1      : {write: 0, L}\n    # Then, restore the current digit, and repeat with the next digit.\n    back0:\n      [0,1,O,I,+]: R\n      c: {write: 0, L: read}\n    back1:\n      [0,1,O,I,+]: R\n      c: {write: 1, L: read}\n\n    # Finish: rewrite place markers back to 0s and 1s.\n    rewrite:\n      O: {write: 0, L}\n      I: {write: 1, L}\n      [0,1]: L\n      ' ': {R: done}\n    done:\n\n\n  # Exercise:\n\n  # • Generate the Fibonacci sequence in binary, listed from right to left:\n  #   ...1101 1000 101 11 10 1 1 0\n  #   Hint: prefix the current number with a +, copy the previous number\n  #   and place it left of the +, run the adder, and repeat.\n  #   Example: '1 0' => '+1 0' => '0+1 0' => '1 1 0' => '+1 1 0' => ...\npositions:\n  right:   {x: 300, y: 130}\n  rewrite: {x: 500, y: 130}\n  done:    {x: 620, y: 130}\n\n  back0:  {x: 250, y: 250}\n  read:   {x: 400, y: 250}\n  back1:  {x: 550, y: 250}\n  carry:  {x: 650, y: 250}\n\n  add0:   {x: 150, y: 400}\n  have0:  {x: 300, y: 400}\n  have1:  {x: 500, y: 400}\n  add1:   {x: 650, y: 400}\n"

/***/ }),
/* 23 */
/***/ (function(module, exports) {

	module.exports = "name: binary increment\nsource code: |\n  # Adds 1 to a binary number.\n  input: '1011'\n  blank: ' '\n  start state: right\n  table:\n    # scan to the rightmost digit\n    right:\n      [1,0]: R\n      ' '  : {L: carry}\n    # then carry the 1\n    carry:\n      1      : {write: 0, L}\n      [0,' ']: {write: 1, L: done}\n    done:\n\n\n  # Exercises:\n\n  # • Modify the machine to always halt on the leftmost digit\n  #   (regardless of the number's length).\n  #   Hint: add a state between carry and done.\n\n  # • Make a machine that adds 2 instead of 1.\n  #   Hint: 2 is '10' in binary, so the last digit is unaffected.\n  #   Alternative hint: chain together two copies of the machine from\n  #   the first exercise (renaming the states of the second copy).\n\n  # • Make a machine to subtract 1.\n  #   To simplify things, assume the input is always greater than 0.\npositions:\n  right: {x: 230, y: 250}\n  carry: {x: 400, y: 250}\n  done: {x: 570, y: 250}\n"

/***/ }),
/* 24 */
/***/ (function(module, exports) {

	module.exports = "name: binary multiplication\nsource code: |\n  # Multiplies two binary numbers together.\n\n  # Examples: '11*11' => '1001', '111*110' => '101010'.\n  input: '11*101' # 3*5 = 15 (1111 in binary)\n  blank: ' '\n  start state: start\n  table:\n    # Prefix the input with a '+', and go to the rightmost digit.\n    start:\n      [0,1]: {L: init}\n    init:\n      ' ': {write: '+', R: right}\n    right:\n      [0,1,'*']: R\n      ' ': {L: readB}\n\n    # Read and erase the last digit of the multiplier.\n    # If it's 1, add the current multiplicand.\n    # In any case, double the multiplicand afterwards.\n    readB:\n      0: {write: ' ', L: doubleL}\n      1: {write: ' ', L: addA}\n    addA:\n      [0,1]: L\n      '*': {L: read} # enter adder\n    # Double the multiplicand by appending a 0.\n    doubleL:\n      [0,1]: L\n      '*': {write: 0, R: shift}\n    double: # return from adder\n      [0,1,+]: R\n      '*': {write: 0, R: shift}\n    # Make room by shifting the multiplier right 1 cell.\n    shift:\n      0: {write: '*', R: shift0}\n      1: {write: '*', R: shift1}\n      ' ': {L: tidy} # base case: multiplier = 0\n    shift0:\n      0:   {R: shift0}\n      1:   {write: 0, R: shift1}\n      ' ': {write: 0, R: right}\n    shift1:\n      0:   {write: 1, R: shift0}\n      1:   {R: shift1}\n      ' ': {write: 1, R: right}\n\n    tidy:\n      [0,1]: {write: ' ', L}\n      +: {write: ' ', L: done}\n    done:\n\n  # This is the 'binary addition' machine almost verbatim.\n  # It's adjusted to keep the '+'\n  # and to lead to another state instead of halting.\n    read:\n      0: {write: c, L: have0}\n      1: {write: c, L: have1}\n      +: {L: rewrite} # keep the +\n    have0: {[0,1]: L, +: {L: add0}}\n    have1: {[0,1]: L, +: {L: add1}}\n    add0:\n      [0,' ']: {write: O, R: back0}\n      1      : {write: I, R: back0}\n      [O,I]  : L\n    add1:\n      [0,' ']: {write: I, R: back1}\n      1      : {write: O, L: carry}\n      [O,I]  : L\n    carry:\n      [0,' ']: {write: 1, R: back1}\n      1      : {write: 0, L}\n    back0:\n      [0,1,O,I,+]: R\n      c: {write: 0, L: read}\n    back1:\n      [0,1,O,I,+]: R\n      c: {write: 1, L: read}\n    rewrite:\n      O: {write: 0, L}\n      I: {write: 1, L}\n      [0,1]: L\n      ' ': {R: double} # when done, go to the 'double' state\n\n\n  # Remark:\n  # We can view the machine as expressing a recursive function:\n\n  #   multiply(a, b) = mult(0, a, b)\n\n  #   mult(acc, a, 0     ) = acc\n  #   mult(acc, a, 2k + 0) = mult(acc    , 2a, k)   where k ≠ 0\n  #   mult(acc, a, 2k + 1) = mult(acc + a, 2a, k)\n\n  # where a, b, and k are natural numbers.\n\n  # Each reduction maintains the invariant\n  #   mult(acc, a, b) = acc + a * b\n  # Note that mult's third argument (b) is always decreasing,\n  # so mult is guaranteed to halt.\n  # Eventually b reaches 0 and the result is simply the accumulator.\npositions:\n  start:  {x: 80 , y: 70}\n  init:   {x: 190, y: 70}\n  tidy:   {x: 730, y: 70}\n  done:   {x: 730, y: 180}\n\n  right:  {x: 300, y: 115}\n  shift:  {x: 600, y: 115}\n  shift1: {x: 450, y: 70}\n  shift0: {x: 450, y: 160}\n\n  readB:  {x: 300, y: 215}\n  addA:   {x: 160, y: 215}\n  doubleL: {x: 550, y: 215}\n\n  rewrite: {x: 363, y: 300}\n  double: {x: 650, y: 300}\n\n  back0:  {x: 160, y: 370}\n  read:   {x: 300, y: 370}\n  back1:  {x: 440, y: 370}\n  carry:  {x: 540, y: 370}\n\n  add0:   {x:  60, y: 470}\n  have0:  {x: 200, y: 470}\n  have1:  {x: 400, y: 470}\n  add1:   {x: 540, y: 470}\n"

/***/ }),
/* 25 */
/***/ (function(module, exports) {

	module.exports = "name: 3-state busy beaver\nsource code: |\n  # A 3-state 2-symbol busy beaver for most non-blank symbols.\n  # It takes 13 steps and leaves 6 non-blank symbols on the tape.\n\n  # What's a \"busy beaver\"?\n  #   Suppose every possible Turing machine with n states and k symbols\n  #   (for instance, 3 states and 2 symbols) were started on\n  #   a blank tape with no input.\n  #   Some of the machines would never halt. Out of the ones that do halt,\n  #   a machine that leaves the most non-blank symbols on the tape\n  #   is called a busy beaver.\n  blank: '0'\n  start state: A\n  table:\n    A:\n      0: {write: 1, R: B}\n      1: {L: C}\n    B:\n      0: {write: 1, L: A}\n      1: R\n    C:\n      0: {write: 1, L: B}\n      1: {R: H}\n    H:\n\n  # An alternative criterion is halting after the most steps.\n  # This busy beaver takes the most steps (21) but only prints 5 1's:\n    # A:\n    #   0: {write: 1, R: B}\n    #   1: {R: H}\n    # B:\n    #   0: {write: 1, L: B}\n    #   1: {write: 0, R: C}\n    # C:\n    #   0: {write: 1, L}\n    #   1: {L: A}\n    # H:\n\n\n  # Exercise:\n\n  # • Consider Turing machines that have n states and k symbols.\n  #   Instead of a missing instruction, halting is denoted by\n  #   a transition to a special \"halt\" state (for a total of n+1 states).\n  #   How many different transition functions are possible?\n\n  #   Hint: Each instruction writes a symbol, moves left or right,\n  #   and goes to a state.\n  #   There is one instruction per combination of non-halt state & symbol.\n\n\n\n  #   Answer: (2k(n+1))^(nk)\npositions:\n  A: {x: 320, y: 296.188}\n  B: {x: 400, y: 157.624}\n  C: {x: 480, y: 296.188}\n  H: {x: 400, y: 376.188}\n"

/***/ }),
/* 26 */
/***/ (function(module, exports) {

	module.exports = "name: 4-state busy beaver\nsource code: |\n  # A 4-state 2-symbol busy beaver\n  # that halts after 107 steps, leaving 13 1's on the tape.\n  # It takes the most steps *and* prints the most 1's.\n  blank: 0\n  start state: A\n  table:\n    A: {0: {write: 1, R: B}, 1:           {L: B}}\n    B: {0: {write: 1, L: A}, 1: {write: 0, L: C}}\n    C: {0: {write: 1, R: H}, 1:           {L: D}}\n    D: {0: {write: 1, R   }, 1: {write: 0, R: A}}\n    H:\n\n\n  # Finding a busy beaver requires considering every n-state k-symbol\n  # machine and proving either that it halts with no more non-blank symbols\n  # or that it never halts at all.\n\n  # Even with strategies to reduce the search space—\n  # including normalization, accelerated simulation, and automated proofs—\n  # there are still machines that show surprising complexity\n  # and require individual analysis.\n\n  # This 4-state busy beaver was proven by Allen Brady in 1983.\n  # Busy beavers for 5 states and above are as yet unknown.\n  # At the time of writing, the current 5-state 2-symbol contender\n  # takes 47,176,870 steps to halt, and the 6-state contender\n  # takes over 7.4 * 10^36534 steps\n  # (http://www.logique.jussieu.fr/~michel/bbc.html).\n  # \"Given that 5-state 2-symbol halting Turing machines can compute\n  # Collatz-like congruential functions, it may be very hard to find\n  # [the next busy beaver]\" (https://oeis.org/A060843).\n\n\n  # An entertaining read on busy beavers and their profoundness:\n\n  # • \"Who Can Name the Bigger Number?\"\n  #   http://www.scottaaronson.com/writings/bignumbers.html\npositions:\n  # square with side length 160\n  A: {x: 320, y: 170}\n  B: {x: 480, y: 170}\n\n  C: {x: 480, y: 330}\n  D: {x: 320, y: 330}\n  H: {x: 620, y: 330}\n"

/***/ }),
/* 27 */
/***/ (function(module, exports) {

	module.exports = "name: copy 1s\nsource code: |\n  # Copies a string of consecutive 1s.\n  input: '111'\n  blank: 0\n  start state: each\n  table:\n    # mark the current 1 by erasing it\n    each:\n      0: {R: H}\n      1: {write: 0, R: sep}\n    # skip to the separator\n    sep:\n      0: {R: add}\n      1: R\n    # skip to the end of the copy and write a 1\n    add:\n      0: {write: 1, L: sepL}\n      1: R\n    # return to the separator\n    sepL:\n      0: {L: next}\n      1: L\n    # return to the erased 1, restore it, and then advance to the next 1\n    next:\n      0: {write: 1, R: each}\n      1: L\n    H:\n\n\n  # Exercises:\n\n  # • Edit the machine to copy the string indefinitely,\n  #   i.e. given the input '11', produce 11011011011...\n  #   Hint: this can be done by modifying only one transition.\n\n  # • Make a machine to output the endless sequence 1011011101111011111...\npositions:\n  each: {x: 400   , y: 100}\n  sep:  {x: 400.01, y: 250}\n  add:  {x: 400.02, y: 400}\n  sepL: {x: 250   , y: 250}\n  next: {x: 250.01, y: 100}\n  H:    {x: 550   , y: 100}\n"

/***/ }),
/* 28 */
/***/ (function(module, exports) {

	module.exports = "name: divisible by 3\nsource code: |\n  # Checks if a binary number is divisible by 3.\n  input: '1001' # try '1111' (15), '10100' (20), '111001' (57)\n  blank: ' '\n  # How it works:\n\n  # Consider reading a binary number, say 10011 (19),\n  # from left to right one digit at a time.\n  # Each time a digit is read, the new value equals the new digit\n  # plus the old value shifted left one place (multiplied by 2).\n\n  # Digits  Value\n  # -------------\n  #         0\n  # 1       1\n  # 10      2\n  # 100     4\n  # 1001    9\n  # 10011   19\n\n  # Now instead of tracking the entire number, just track the remainder.\n  # It works the same way.\n  start state: q0\n  table:\n    q0:\n      0: R       # 2*0 + 0 = 0\n      1: {R: q1} # 2*0 + 1 = 1\n      ' ': {R: accept}\n    q1:\n      0: {R: q2} # 2*1 + 0 = 2\n      1: {R: q0} # 2*1 + 1 = 3\n    q2:\n      0: {R: q1} # 2*2 + 0 = 4\n      1: {R: q2} # 2*2 + 1 = 5\n    accept:\n\n\n  # Exercises:\n\n  # • Modify the machine to check if n-1 is divisible by 3,\n  #   where n is the input. That is, accept the binary of 1, 4, 7, 10, ...\n  #   Hint: this can be done without modifying the tape (no 'write').\n\n  # • Round the number up to the nearest multiple of 3.\n  #   Hint: do one pass right to find the remainder, then another pass left\n  #   to add. See the 'binary increment' example for how to add.\n\n  # • Round the number down to the nearest multiple of 3.\npositions:\n  q0: {x: 230, y: 250}\n  q1: {x: 400, y: 250}\n  q2: {x: 570, y: 250}\n  accept: {x: 230.01, y: 380}\n"

/***/ }),
/* 29 */
/***/ (function(module, exports) {

	module.exports = "name: divisible by 3 (base 10)\nsource code: |\n  # Checks if a base 10 number is divisible by 3.\n  input: 4728 # try 42, 57, 1337, 5328, 7521, 314159265\n  blank: ' '\n  # This uses the same idea as the base 2 version.\n  #\n  # To make things more interesting, we derive the step relation:\n  # Let x be the number left of the tape head,\n  #     d the digit under the head, and\n  #     x' the number up to and including the head.\n  # Then\n  #   x' = 10x + d .\n  # Notice 10 ≡ 1 (mod 3). Therefore\n  #   x' ≡ x + d (mod 3) .\n  # Each step simply adds the new digit's remainder mod 3.\n  start state: q0\n  table:\n    q0:\n      [0,3,6,9]: R     # 0 + 0 ≡ 0 (mod 3)\n      [1,4,7]: {R: q1} # 0 + 1 ≡ 1\n      [2,5,8]: {R: q2} # 0 + 2 ≡ 2\n      ' ': {R: accept}\n    q1:\n      [0,3,6,9]: R     # 1 + 0 ≡ 1\n      [1,4,7]: {R: q2} # 1 + 1 ≡ 2\n      [2,5,8]: {R: q0} # 1 + 2 ≡ 0\n    q2:\n      [0,3,6,9]: R     # 2 + 0 ≡ 2\n      [1,4,7]: {R: q0} # 2 + 1 ≡ 0\n      [2,5,8]: {R: q1} # 2 + 2 ≡ 1\n    accept:\n\n\n  # Exercises:\n\n  # • Check for divisibility by 5.\n  #   Hint: only 2 states (besides accept) are required.\n\n  # • Check for divisibility by 4.\n  #   Hint: use 4 states (besides accept).\npositions:\n  # centered equilateral triangle with side length 250\n  q0: {x: 275, y: 322.1688}\n  q1: {x: 400, y: 105.6624}\n  q2: {x: 525, y: 322.1688}\n  accept: {x: 275.01, y: 430}\n"

/***/ }),
/* 30 */
/***/ (function(module, exports) {

	module.exports = "name: multiplied lengths\nsource code: |\n  # Decides the language { a^(i)b^(j)c^(k) | i*j = k and i,j,k ≥ 1 }.\n  # (a's followed by b's then c's,\n  # where the number of a's multiplied by the number of b's\n  # equals the number of c's.)\n  input: aabbbcccccc # try abc, b, aabcbc, aabcc, aabbbbcccccccc\n  blank: ' '\n  start state: start\n\n  table:\n    # Check for the form a^(i)b^(j)c^(k) where i,j,k ≥ 1.\n    start:  {        a: {R: a+}}\n    a+:     {a: R,   b: {R: b+}}\n    b+:     {b: R,   c: {R: c+}}\n    c+:     {c: R, ' ': {L: left}}\n    left:\n      [a,b,c]: L\n      ' ': {R: eachA}\n    # Then check that i*j = k.\n    #   The approach is two nested loops:\n    #   For each 'a':\n    #     For each 'b':\n    #       Mark one 'c'\n    #   At the end, check that all c's are marked.\n    eachA:\n      a: {write: ' ', R: eachB}\n      b: {R: scan}\n    eachB:\n      a: R\n      b: {write: B, R: markC}\n      C: {L: nextA}\n    markC:\n      [b,C]: R\n      c: {write: C, L: nextB}\n    nextB:\n      [b,C]: L\n      B: {R: eachB}\n    nextA:\n      a: L\n      B: {write: b, L}\n      ' ': {R: eachA}\n\n    scan:\n      [b,C]: R\n      ' ': {R: accept}\n    accept:\npositions:\n  start:  {x: 180, y: 40}\n  a+:     {x: 180, y: 180}\n  b+:     {x: 180, y: 320}\n  c+:     {x: 180, y: 460}\n  left:   {x: 290, y: 320}\n\n  accept: {x: 400, y: 40}\n  eachA:  {x: 400, y: 180}\n  eachB:  {x: 400, y: 320}\n  markC:  {x: 400, y: 460}\n\n  scan:   {x: 560, y: 180}\n  nextA:  {x: 560, y: 320}\n  nextB:  {x: 560, y: 460}\n"

/***/ }),
/* 31 */
/***/ (function(module, exports) {

	module.exports = "name: equal strings\nsource code: |\n  # Decides the language { w#w | w ∈ {0,1}* }\n  # (two equal binary strings separated by '#')\n  input: '01001#01001' # try '#', '1#10', '10#1', '10#10'\n  blank: ' '\n  # Two strings are equal if they are both the empty string,\n  # or they start with the same symbol and are equal thereafter.\n  start state: start\n  table:\n    start:\n      # Inductive case: start with the same symbol.\n      0: {write: ' ', R: have0}\n      1: {write: ' ', R: have1}\n      # Base case: empty string.\n      '#': {R: check}\n    have0:\n      [0,1]: R\n      '#': {R: match0}\n    have1:\n      [0,1]: R\n      '#': {R: match1}\n    match0:\n      x: R\n      0: {write: x, L: back}\n    match1:\n      x: R\n      1: {write: x, L: back}\n    back:\n      [0,1,'#',x]: L\n      ' ': {R: start}\n    check:\n      x: R\n      ' ': {R: accept}\n    accept:\n\n\n  # Exercises:\n\n  # • Accept if the second string is the bitwise complement\n  #   (1s and 0s swapped) of the first, e.g. accept '1101#0010'.\n\n  # • Check that a binary string has the same number of 0s and 1s;\n  #   eg., accept '001110' but reject '10010'.\n\n  # • Check if two strings are different.\n  #   Example: accept '00#001' and '0101#0111', but reject '1001#1001'.\npositions:\n  accept: {x: 80 , y: 250}\n  check:  {x: 190, y: 250}\n  # regular hexagon with side length 150\n  start:  {x: 300, y: 250}\n  back:   {x: 600, y: 250}\n  have1:  {x: 375, y: 120.10}\n  match1: {x: 525, y: 120.10}\n  have0:  {x: 375, y: 379.90}\n  match0: {x: 525, y: 379.90}\n"

/***/ }),
/* 32 */
/***/ (function(module, exports) {

	module.exports = "name: three equal lengths\nsource code: |\n  # Decides the language { aⁿbⁿcⁿ | n ≥ 1 }, that is,\n  # accepts a's followed by b's then c's of the same length.\n  input: aabbcc # try bac, aabc, aabcc, aabcbc\n  blank: ' '\n  # Mark the first a, b, and c on each pass (by capitalizing them).\n  # All a's must precede all b's, which must precede all c's.\n  # When there are no more a's,\n  # all input symbols should have been marked.\n  start state: qA\n  table:\n    qA:\n      a: {write: A, R: qB}\n      B: {R: scan}\n    qB:\n      [a,B]: R\n      b: {write: B, R: qC}\n    qC:\n      [b,C]: R\n      c: {write: C, L: back}\n    back:\n      [a,B,b,C]: L\n      A: {R: qA}\n    scan:\n      [B,C]: R\n      ' ': {R: accept}\n    accept:\n\n\n  # Exercises:\n\n  # • Suppose a ledger starts from 0 and gains one dollar for each +\n  #   and loses one for each -. Reading left to right,\n  #   check that the account never goes into the negative.\n  #   Examples: accept '+-++' and '++-+--', reject '-++' and '++---+'.\n\n  # • Check parentheses for proper nesting,\n  #   e.g. accept '()(()()())' but reject '(()))(' and '(()('.\npositions:\n  qA: {x: 240, y: 250}\n  qB: {x: 400, y: 250}\n  qC: {x: 560, y: 250}\n  back:   {x: 400, y: 370}\n  scan:   {x: 320, y: 150}\n  accept: {x: 480, y: 150}\n"

/***/ }),
/* 33 */
/***/ (function(module, exports) {

	module.exports = "name: palindrome\nsource code: |\n  # Accepts palindromes made of the symbols 'a' and 'b'\n  input: 'abba' # try a, ab, bb, babab\n  blank: ' '\n  start state: start\n  synonyms:\n    accept: {R: accept}\n    reject: {R: reject}\n  # A palindrome is either the empty string, a single symbol,\n  # or a (shorter) palindrome with the same symbol added to both ends.\n  table:\n    start:\n      a: {write: ' ', R: haveA}\n      b: {write: ' ', R: haveB}\n      ' ': accept # empty string\n    haveA:\n      [a,b]: R\n      ' ': {L: matchA}\n    haveB:\n      [a,b]: R\n      ' ': {L: matchB}\n    matchA:\n      a: {write: ' ', L: back} # same symbol at both ends\n      b: reject\n      ' ': accept # single symbol\n    matchB:\n      a: reject\n      b: {write: ' ', L: back} # same symbol at both ends\n      ' ': accept # single symbol\n    back:\n      [a,b]: L\n      ' ': {R: start}\n    accept:\n    reject:\n\n\n  # Exercise:\n\n  # • Modify the machine to include 'c' in the symbol alphabet,\n  #   so it also works for strings like 'cabbac'.\npositions:\n  haveA:  {x: 240, y: 185}\n  start:  {x: 400, y: 185}\n  haveB:  {x: 560, y: 185}\n\n  matchA: {x: 240, y: 315}\n  back:   {x: 400, y: 315}\n  matchB: {x: 560, y: 315}\n\n  accept: {x: 400, y: 55}\n  reject: {x: 400, y: 445}\n"

/***/ }),
/* 34 */
/***/ (function(module, exports) {

	module.exports = "name: powers of two\nsource code: |\n  # Matches strings of 0s whose length is a power of two.\n\n  # This example comes from the textbook\n  #   \"Introduction to the Theory of Computation\" (3rd edition, 2012)\n  #   by Michael Sipser\n  # The states have been renamed (from q1, q2, etc.)\n  # to make it easier to understand.\n  input: '0000' # try '0', '000', '00000000'\n  blank: ' '\n  start state: zero\n  synonyms:\n    accept: {R: accept}\n    reject: {R: reject}\n  # The idea: divide the length by 2 repeatedly until it reaches 1.\n\n  # To do this, cross off every other 0, one pass at a time.\n  # If any pass reads an odd number of 0s (a remainder), reject right away.\n  # Otherwise if every pass halves the length cleanly,\n  # the length must be a power of two (1*2^n for n ≥ 0).\n\n  # Note that since the first 0 is never crossed off, we can simply\n  # erase it on the first pass and start the count from 1 from then on.\n  table:\n    zero:\n      0  : {write: ' ', R: one}\n      ' ': reject\n    # Base case: accept length of 1 = 2^0.\n    one:\n      0  : {write: x, R: even}\n      ' ': accept\n      x  : R\n    # Inductive case: divide by 2 and check for no remainder.\n    even:\n      0  : {R: odd}\n      ' ': {L: back} # return for another pass\n      x  : R\n    odd: # odd and > 1\n      0  : {write: x, R: even}\n      ' ': reject # odd number of 0s on this pass\n      x  : R\n    back:\n      ' ': {R: one}\n      [0,x]: L\n    accept:\n    reject:\npositions:\n  zero:   {x: 200, y: 200}\n  one:    {x: 400, y: 200}\n  even:   {x: 600, y: 200}\n\n  odd:    {x: 600, y: 385}\n  back:   {x: 500, y: 125}\n  accept: {x: 400, y: 300}\n  reject: {x: 200, y: 385}\n"

/***/ }),
/* 35 */
/***/ (function(module, exports) {

	module.exports = "name: repeat 0 1\nsource code: |\n  # This is the first example machine given by Alan Turing in his 1936 paper\n  #   \"On Computable Numbers, with an Application to\n  #    the Entscheidungsproblem\".\n  # It simply writes the endless sequence 0 1 0 1 0 1...\n  blank: ' '\n  start state: b\n  table:\n    b:\n      ' ': {write: 0, R: c}\n    c:\n      ' ':           {R: e}\n    e:\n      ' ': {write: 1, R: f}\n    f:\n      ' ':           {R: b}\n\n\n  # (Turing uses the convention of leaving a gap after each output cell,\n  # reserving it for marking the cell. For instance, on a tape that\n  # contains '0 1x0 0 1 1y1y0y', x marks the leftmost 1 and y marks 110.)\npositions:\n  b: {x: 300, y: 200, fixed: false}\n  c: {x: 450, y: 150, fixed: false}\n  e: {x: 500, y: 300, fixed: false}\n  f: {x: 350, y: 350, fixed: false}\n"

/***/ }),
/* 36 */
/***/ (function(module, exports) {

	module.exports = "name: unary multiplication\nsource code: |\n  # Multiplies together two unary numbers separated by a '*'.\n  # (Unary is like tallying. Here '||*|||' means 2 times 3.)\n  input: '||*|||' # try '*', '|*|||', '||||*||'\n  blank: ' '\n\n  # The idea:\n  #   multiply(0, b) = 0\n  #   multiply(a, b) = b + multiply(a-1, b)   when a > 0\n  start state: eachA\n  table:\n    # For each 1 in a, add a copy of b.\n    eachA:\n      '|': {write: ' ', R: toB}  # Inductive case: a > 0.\n      '*': {R: skip}             # Base case:      a = 0.\n    toB:\n      '|': R\n      '*': {R: eachB} # enter copier\n    nextA: # return from copier\n      ' ': {write: '|', R: eachA}\n      ['|','*']: L\n\n    skip:\n      '|': R\n      ' ': {R: done}\n    done:\n\n    # This is the 'copy 1s' machine, with ' ' as 0 and '|' as 1.\n    eachB:\n      ' ': {L: nextA}\n      '|': {write: ' ', R: sep}\n    sep:\n      ' ': {R: add}\n      '|': R\n    add:\n      ' ': {write: '|', L: sepL}\n      '|': R\n    sepL:\n      ' ': {L: nextB}\n      '|': L\n    nextB:\n      ' ': {write: '|', R: eachB}\n      '|': L\n\npositions:\n  eachA:  {x: 400, y:  50}\n  toB:    {x: 400, y: 150}\n  eachB:  {x: 400, y: 250}\n  sep:   {x: 400, y: 350}\n  add:   {x: 400, y: 450}\n\n  sepL:  {x: 280, y: 350}\n  nextB:  {x: 280, y: 250}\n\n  nextA:  {x: 280, y: 90}\n  skip:   {x: 520, y: 90}\n  done:   {x: 520, y: 190}\n"

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	/* global document */
	var KeyValueStorage = __webpack_require__(7).KeyValueStorage;
	var TMDocument = __webpack_require__(9);
	var d3 = __webpack_require__(2);
	var defaults = __webpack_require__(1).defaults; // NB. 2nd arg takes precedence
	
	/**
	 * Document menu controller.
	 *
	 * The view is fully determined by a 3-tuple: ([ID], ID -> Name, currentID).
	 * @constructor
	 * @param {Object}  args                  argument object
	 * @param {HTMLSelectElement}
	 *                  args.menu
	 * @param {?Node}  [args.group=args.menu] Node to add documents to.
	 * @param {string}  args.storagePrefix
	 * @param {?(TMDocument -> HTMLOptionElement)}
	 *                  args.makeOption       Customize rendering for each document entry.
	 * @param {?string} args.firsttimeDocID   Document to open on the first visit.
	 */
	function DocumentMenu(args) {
	  var menu = args.menu,
	      group = args.group || menu,
	      storagePrefix = args.storagePrefix,
	      firsttimeDocID = args.firsttimeDocID;
	
	  if (!menu) {
	    throw new TypeError('DocumentMenu: missing parameter: menu element');
	  } else if (!storagePrefix) {
	    throw new TypeError('DocumentMenu: missing parameter: storage prefix');
	  }
	  if (args.makeOption) {
	    this.optionFromDocument = args.makeOption;
	  }
	  this.menu = menu;
	  this.group = group;
	  this.group.innerHTML = '';
	  this.__storagePrefix = storagePrefix;
	
	  // Load document entries (non-examples)
	  this.doclist = new DocumentList(storagePrefix + '.list');
	  this.render();
	  // Re-open last-opened document
	  this.selectDocID(this.getSavedCurrentDocID() || firsttimeDocID);
	
	  // Listen for selection changes
	  var self = this;
	  this.menu.addEventListener('change', function () {
	    self.onChange(self.currentDocument, {type: 'open'});
	  });
	
	  // Listen for storage changes in other tabs/windows
	  KeyValueStorage.addStorageListener(function (e) {
	    var docID;
	    var option, newOption;
	
	    if (e.key === self.doclist.storageKey) {
	      // case: [ID] list changed
	      self.doclist.readList();
	      self.render();
	    } else if ( (docID = TMDocument.IDFromNameStorageKey(e.key)) ) {
	      // case: single document renamed: (ID -> Name) changed
	      option = self.findOptionByDocID(docID);
	      if (option) {
	        // replace the whole <option>, to be consistent with .optionFromDocument
	        option.parentNode.replaceChild(
	          newOption = self.optionFromDocument(new TMDocument(docID)),
	          option
	        );
	        newOption.selected = option.selected;
	        d3.select(newOption).datum( d3.select(option).datum() );
	      }
	    }
	  });
	}
	
	Object.defineProperties(DocumentMenu.prototype, {
	  currentOption: {
	    get: function () {
	      return this.menu.options[this.menu.selectedIndex];
	    },
	    enumerable: true
	  },
	  currentDocument: {
	    get: function () {
	      var opt = this.currentOption;
	      return opt ? new TMDocument(opt.value) : null;
	    },
	    enumerable: true
	  }
	});
	
	DocumentMenu.prototype.render = function () {
	  var currentDocID = this.currentOption ? this.currentOption.value : null;
	
	  var option = d3.select(this.group).selectAll('option')
	    .data(this.doclist.list, function (entry) { return entry.id; });
	
	  option.exit().remove();
	
	  var self = this;
	  option.enter().insert(function (entry) {
	    return self.optionFromDocument(new TMDocument(entry.id));
	  });
	
	  // If current document was deleted, switch to another document
	  if (this.currentOption.value !== currentDocID) {
	    // fallback 1: saved current docID
	    if (!this.selectDocID(this.getSavedCurrentDocID(), {type: 'delete'})) {
	      // fallback 2: whatever is now selected
	      this.onChange(this.currentDocument, {type: 'delete'});
	    }
	  }
	};
	
	// Returns the <option> whose 'value' attribute is docID.
	DocumentMenu.prototype.findOptionByDocID = function (docID) {
	  return this.menu.querySelector('option[value="' + docID.replace(/"/g, '\\"') + '"]');
	};
	
	// Selects (switches the active item to) the given docID. Returns true on success.
	DocumentMenu.prototype.selectDocID = function (docID, opts) {
	  try {
	    this.findOptionByDocID(docID).selected = true;
	  } catch (e) {
	    return false;
	  }
	  this.onChange(this.currentDocument, opts);
	  return true;
	};
	
	// Saves the current (selected) docID to storage.
	DocumentMenu.prototype.saveCurrentDocID = function () {
	  var docID = this.currentOption && this.currentOption.value;
	  if (docID) {
	    KeyValueStorage.write(this.__storagePrefix + '.currentDocID', docID);
	  }
	};
	
	// Returns the saved current docID, otherwise null.
	DocumentMenu.prototype.getSavedCurrentDocID = function () {
	  return KeyValueStorage.read(this.__storagePrefix + '.currentDocID');
	};
	
	// Configurable methods
	
	DocumentMenu.prototype.optionFromDocument = function (doc) {
	  var option = document.createElement('option');
	  option.value = doc.id;
	  option.text = doc.name || 'untitled';
	  return option;
	};
	
	// Called when the current document ID changes
	// through user action (<select>) or this class's API.
	// The callback receives the new value of .currentDocument,
	// along with the options object (whose .type
	// is 'duplicate', 'delete', or 'open').
	DocumentMenu.prototype.onChange = function () {
	};
	
	// Internal Helpers
	
	// prepend then select
	DocumentMenu.prototype.__prepend = function (doc, opts) {
	  var option = this.optionFromDocument(doc);
	  this.group.insertBefore(option, this.group.firstChild);
	  if (opts && opts.select) {
	    this.menu.selectedIndex = option.index;
	    this.onChange(doc, opts);
	  }
	  return doc;
	};
	
	// Methods not about Current Document
	
	DocumentMenu.prototype.newDocument = function (opts) {
	  return this.__prepend(this.doclist.newDocument(), defaults({type: 'open'}, opts));
	};
	
	// Methods about Current Document
	
	DocumentMenu.prototype.duplicate = function (doc, opts) {
	  return this.__prepend(this.doclist.duplicate(doc), defaults({type: 'duplicate'}, opts));
	};
	
	DocumentMenu.prototype.rename = function (name) {
	  this.currentDocument.name = name;
	  this.currentOption.text = name;
	};
	
	// required invariant: one option is always selected.
	// returns true if the current entry was removed from the list.
	DocumentMenu.prototype.delete = function (opts) {
	  this.currentDocument.delete();
	  var index = this.menu.selectedIndex;
	  var didDeleteEntry = this.doclist.deleteIndex(index);
	  if (didDeleteEntry) {
	    this.currentOption.remove();
	    this.menu.selectedIndex = index;
	    this.onChange(this.currentDocument, defaults({type: 'delete'}, opts));
	  }
	  return didDeleteEntry;
	};
	
	/////////////////////
	// Document List   //
	// (model/storage) //
	/////////////////////
	
	
	// for custom documents.
	function DocumentList(storageKey) {
	  this.storageKey = storageKey;
	  this.readList();
	}
	
	// () -> string
	DocumentList.newID = function () {
	  return String(Date.now());
	};
	
	// internal methods.
	DocumentList.prototype.add = function (docID) {
	  this.__list.unshift({id: docID});
	  this.writeList();
	};
	DocumentList.prototype.readList = function () {
	  this.__list = JSON.parse(KeyValueStorage.read(this.storageKey)) || [];
	};
	DocumentList.prototype.writeList = function () {
	  KeyValueStorage.write(this.storageKey, JSON.stringify(this.__list));
	};
	
	DocumentList.prototype.newDocument = function () {
	  var newID = DocumentList.newID();
	  this.add(newID);
	  return new TMDocument(newID);
	};
	
	DocumentList.prototype.duplicate = function (doc) {
	  return this.newDocument().copyFrom(doc);
	};
	
	/**
	 * Behaves like list.splice(index, 1).
	 * @param  {number} index index of the element to delete
	 * @return {boolean} true if an element was removed, false otherwise (index out of bounds)
	 */
	DocumentList.prototype.deleteIndex = function (index) {
	  var deleted = this.__list.splice(index, 1);
	  this.writeList();
	  return (deleted.length > 0);
	};
	
	Object.defineProperties(DocumentList.prototype, {
	  list: {
	    get: function () { return this.__list; },
	    enumerable: true
	  }
	});
	
	module.exports = DocumentMenu;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	var TMSimulator = __webpack_require__(39),
	    parser = __webpack_require__(13),
	    util = __webpack_require__(3),
	    ace = __webpack_require__(17),
	    d3 = __webpack_require__(2);
	var TMSpecError = parser.TMSpecError;
	var YAMLException = parser.YAMLException;
	var UndoManager = ace.require('ace/undomanager').UndoManager;
	
	// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server#answer-33542499
	function download(filename, data) {
	    const blob = new Blob([data], {type: 'text/csv'});
	    if(window.navigator.msSaveOrOpenBlob) {
	        window.navigator.msSaveBlob(blob, filename);
	    }
	    else{
	        const elem = window.document.createElement('a');
	        elem.href = window.URL.createObjectURL(blob);
	        elem.download = filename;        
	        document.body.appendChild(elem);
	        elem.click();        
	        document.body.removeChild(elem);
	    }
	}
	
	/**
	 * For editing and displaying a TMDocument.
	 * The controller coordinates the interactions between
	 *   1. simulator
	 *   2. code editor
	 *   3. storage
	 *
	 * All container and button params are required.
	 * @param {Object} containers
	 *   Empty containers to use (contents will likely be replaced).
	 * @param {HTMLDivElement} containers.simulator
	 * @param {HTMLDivElement} containers.editorAlerts
	 * @param {HTMLDivElement} containers.editor
	 * @param {Object} buttons Buttons to use.
	 * @param {HTMLButtonElement} buttons.simulator.run
	 * @param {HTMLButtonElement} buttons.simulator.step
	 * @param {HTMLButtonElement} buttons.simulator.reset
	 * @param {HTMLButtonElement} buttons.editor.load For loading the editor source
	 * @param {HTMLButtonElement} buttons.editor.revert For reverting the editor source
	 * @param {TMDocument} document The document to load from and save to.
	 */
	function TMDocumentController(containers, buttons, document) {
	  this.simulator = new TMSimulator(containers.simulator, buttons.simulator);
	
	  // Set up ace editor //
	  var editor = ace.edit(containers.editor);
	  editor.session.setOptions({
	    mode: 'ace/mode/yaml',
	    tabSize: 2,
	    useSoftTabs: true
	  });
	  editor.setOptions({
	    minLines: 15,
	    maxLines: 50
	  });
	  // suppress warning about
	  // "Automatically scrolling cursor into view after selection change"
	  editor.$blockScrolling = Infinity;
	
	  var editorButtons = buttons.editor;
	  var self = this;
	  editorButtons.load
	      .addEventListener('click', function () {
	        self.loadEditorSource();
	        // save whenever "Load" is pressed
	        self.save();
	        self.editor.focus();
	      });
	  editorButtons.export
	      .addEventListener('click', function () {
	        let spec = self.simulator.spec;
	        console.log("exporting...");
	        console.log(spec);
	
	        if (spec.blank === ' ') {
	          alert(`sysprog machine dont support ' ' as blankspace`)
	          throw `sysprog machine dont support ' ' as blankspace`
	        }
	
	        let fileContent = ''
	        fileContent += `ATM`
	        fileContent += `PCS 2302/2024 autogenerate\n`
	        fileContent += `${Array.from(new Set(spec.input)).join(' ')}\n` // alfabeto de entrada
	        fileContent += `${Array.from(new Set(spec.blank + spec.input)).join(' ')}\n` // alfabeto da fita
	        fileContent += `1\n` // numero de fitas
	        fileContent += `1\n` // numero de trilhas na fita 0
	        fileContent += `2\n` // direcoes da fita 0 (infinita nas duas)
	        fileContent += `${spec.startState}\n` // estado inicial
	        fileContent += `${Object.keys(spec.table).find((k) => spec.table[k] === null)}\n` // estado final (estado sem nenhum valor)
	        for(const actualState in spec.table){
	          Object.entries(spec.table[actualState] || {}).filter(([k, v]) => v).flatMap(([k, v]) => k.split(',').map(c => [c, v])).forEach(([readSimbol, action]) => {
	            const nextState = action['state'] || actualState;
	            const moveDirection = action['move'].toString();
	            const writeSimbol = action['symbol'] || readSimbol;
	            fileContent += `${actualState} ${readSimbol} ${writeSimbol} ${nextState} ${moveDirection}\n`
	          })
	        }
	        fileContent += `end`
	        console.log(fileContent);
	        download('tm.txt', fileContent)
	      });
	  editorButtons.revert
	      .addEventListener('click', function () {
	        self.revertEditorSource();
	        self.editor.focus();
	      });
	
	  Object.defineProperties(this, {
	    __document: {
	      value: {editor: {}}, // dummy document that gets replaced
	      writable: true
	    },
	    buttons   : { value: buttons },
	    containers: { value: containers },
	    editor    : { value: editor, enumerable: true }
	  });
	  this.openDocument(document);
	}
	
	TMDocumentController.prototype.getDocument = function () {
	  return this.__document;
	};
	
	// set the backing document, without saving/loading or affecting the views.
	TMDocumentController.prototype.setBackingDocument = function (doc) {
	  this.__document = doc;
	};
	
	// save the current document, then open another one.
	// does nothing if the document ID is the same.
	TMDocumentController.prototype.openDocument = function (doc) {
	  if (this.getDocument().id === doc.id) { return; } // same document
	  this.save();
	  return this.forceLoadDocument(doc);
	};
	
	// (low-level) load the document. current data is discarded without saving.
	// this can be used to switch from a deleted document or reload a document.
	TMDocumentController.prototype.forceLoadDocument = function (doc, keepUndoHistory) {
	  this.setBackingDocument(doc);
	  var diagramSource = doc.sourceCode;
	  var editorSource = doc.editorSourceCode;
	  // init //
	  this.simulator.clear();
	  this.setEditorValue(editorSource == null ? diagramSource : editorSource);
	  // prevent undo-ing to the previous document. note: .reset() doesn't work
	  if (!keepUndoHistory) {
	    this.editor.session.setUndoManager(new UndoManager());
	  }
	
	  if (editorSource == null) {
	    // case: synced: load straight from editor.
	    this.loadEditorSource();
	  } else {
	    // case: not synced: editor has separate contents.
	    this.isSynced = false;
	    try {
	      this.simulator.sourceCode = diagramSource;
	      this.simulator.positionTable = doc.positionTable;
	    } catch (e) {
	      this.showCorruptDiagramAlert(true);
	    }
	  }
	};
	
	TMDocumentController.prototype.save = function () {
	  var doc = this.getDocument();
	  if (this.hasValidDiagram) {
	    // sidenote: deleting first can allow saving when space would otherwise be full
	    doc.editorSourceCode = this.isSynced ? undefined : this.editor.getValue();
	    doc.sourceCode = this.simulator.sourceCode;
	    doc.positionTable = this.simulator.positionTable;
	  } else {
	    if (doc.editorSourceCode == null) {
	      // case 1: editor was synced with the diagram.
	      //  only edit doc.sourceCode until it's fixed;
	      //  don't worsen the problem to case 2.
	      doc.sourceCode = this.editor.getValue();
	    } else {
	      // case 2: editor has separate contents.
	      //  this is more confusing, as there are two "source code" values to contend with.
	      doc.editorSourceCode = this.editor.getValue();
	    }
	  }
	};
	
	/**
	 * Set the editor contents.
	 * • Converts null to '', since editor.setValue(null) crashes.
	 * • Clears the editor alerts.
	 * @param {?string} str
	 */
	TMDocumentController.prototype.setEditorValue = function (str) {
	  this.editor.setValue(util.coalesce(str, ''), -1 /* put cursor at start */);
	  this.setAlertErrors([]);
	};
	
	/////////////////////////
	// Error/Alert Display //
	/////////////////////////
	
	function aceAnnotationFromYAMLException(e) {
	  return {
	    row: e.mark.line,
	    column: e.mark.column,
	    text: 'Not valid YAML (possibly caused by a typo):\n' + e.message,
	    type: 'error'
	  };
	}
	
	TMDocumentController.prototype.setAlertErrors = function (errors) {
	  var self = this;
	  var alerts = d3.select(self.containers.editorAlerts).selectAll('.alert')
	    .data(errors, function (e) { return String(e); }); // key by error description
	
	  alerts.exit().remove();
	
	  alerts.enter()
	    .append('div')
	      .attr('class', 'alert alert-danger')
	      .attr('role', 'alert')
	      .each(/** @this div */ function (e) {
	        var div = d3.select(this);
	        if (e instanceof YAMLException) {
	          var annot = aceAnnotationFromYAMLException(e);
	          var lineNum = annot.row + 1; // annotation lines start at 0; editor starts at 1
	          var column = annot.column;
	          div.append('strong')
	              .text('Syntax error on ')
	            .append('a')
	              .text('line ' + lineNum)
	              .on('click', function () {
	                self.editor.gotoLine(lineNum, column, true);
	                self.editor.focus();
	                // prevent scrolling, especially href="#" scrolling to the top
	                d3.event.preventDefault();
	              })
	              .attr('href', '#' + self.containers.editor.id);
	          div.append('br');
	          // aside: text nodes aren't elements so they need to be wrapped (e.g. in span)
	          // https://github.com/mbostock/d3/issues/94
	          div.append('span').text('Possible reason: ' + e.reason);
	        } else if (e instanceof TMSpecError) {
	          div.html(e.message);
	        } else {
	          div.html('<strong>Unexpected error</strong>: ' + e);
	        }
	      });
	  self.editor.session.setAnnotations(
	    errors
	    .map(function (e) {
	      return (e instanceof YAMLException) ? aceAnnotationFromYAMLException(e) : null;
	    })
	    .filter(function (x) { return x; })
	  );
	};
	
	
	//////////////////////////////
	// Syncing diagram & editor //
	//////////////////////////////
	
	// Sync Status
	
	// This method can be overridden as necessary.
	// The default implementation toggles Bootstrap 3 classes.
	TMDocumentController.prototype.setLoadButtonSuccess = function (didSucceed) {
	  d3.select(this.buttons.editor.load)
	      .classed({
	        'btn-success': didSucceed,
	        'btn-primary': !didSucceed
	      });
	};
	
	// internal. whether the editor and diagram source code are in sync, and the diagram is valid.
	// Updates "Load machine" button display.
	// for future reference: .isSynced cannot be moved to TMDocument because it requires knowledge from the simulator.
	Object.defineProperty(TMDocumentController.prototype, 'isSynced', {
	  set: function (isSynced) {
	    isSynced = Boolean(isSynced);
	    if (this.__isSynced !== isSynced) {
	      this.__isSynced = isSynced;
	      this.setLoadButtonSuccess(isSynced);
	      if (isSynced) {
	        // changes cause desync
	        var onChange = function () {
	          this.isSynced = false;
	          this.editor.removeListener('change', onChange);
	        }.bind(this);
	        this.editor.on('change', onChange);
	      }
	    }
	  },
	  get: function () { return this.__isSynced; }
	});
	
	// public API for isSynced
	TMDocumentController.prototype.getIsSynced = function () {
	  return Boolean(this.isSynced);
	};
	
	// Load & Revert
	
	// internal. used to detect when an imported document is corrupted.
	Object.defineProperty(TMDocumentController.prototype, 'hasValidDiagram', {
	  get: function () {
	    return Boolean(this.simulator.sourceCode);
	  }
	});
	
	/**
	 * Show/hide the notice that the diagram's source code is invalid;
	 * use this when the editor has contents of its own (so it can't display the diagram's source).
	 *
	 * This happens for imported documents that were corrupted.
	 * It can also happen if the value in storage is tampered with.
	 * @param  {boolean} show true to display immediately, false to hide.
	 */
	TMDocumentController.prototype.showCorruptDiagramAlert = function (show) {
	  function enquote(s) { return '<q>' + s + '</q>'; }
	  var div = d3.select(this.simulator.container);
	  if (show) {
	    var revertName = this.buttons.editor.revert.textContent.trim();
	    div.html('')
	      .append('div')
	        .attr('class', 'alert alert-danger')
	        .html('<h4>This imported document has an error</h4>' +
	          [ 'The diagram was not valid and could not be displayed.'
	          , 'You can either load a new diagram from the editor, or attempt to recover this one'
	          , 'using ' + enquote(revertName) + ' (which will replace the current editor contents).'
	          ].join('<br>')
	        );
	  } else {
	    div.selectAll('.alert').remove();
	  }
	};
	
	// Sync from editor to diagram
	TMDocumentController.prototype.loadEditorSource = function () {
	  // load to diagram, and report any errors
	  var errors = (function () {
	    try {
	      var isNewDiagram = !this.hasValidDiagram;
	      this.simulator.sourceCode = this.editor.getValue();
	      if (isNewDiagram) {
	        // loaded new, or recovery succeeded => close error notice, restore positions
	        this.showCorruptDiagramAlert(false);
	        this.simulator.positionTable = this.getDocument().positionTable;
	      }
	      // .toJSON() is the only known way to preserve the cursor/selection(s)
	      // this.__loadedEditorSelection = this.editor.session.selection.toJSON();
	      return [];
	    } catch (e) {
	      return [e];
	    }
	  }.call(this));
	  this.isSynced = (errors.length === 0);
	  this.setAlertErrors(errors);
	};
	
	// Sync from diagram to editor
	TMDocumentController.prototype.revertEditorSource = function () {
	  this.setEditorValue(this.hasValidDiagram
	    ? this.simulator.sourceCode
	    : this.getDocument().sourceCode);
	
	  if (this.hasValidDiagram) {
	    this.isSynced = true;
	  } else {
	    // show errors when reverting to a corrupted diagram
	    this.loadEditorSource();
	  }
	  // if (this.__loadedEditorSelection) {
	  //   this.editor.session.selection.fromJSON(this.__loadedEditorSelection);
	  // }
	};
	
	module.exports = TMDocumentController;


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var parseSpec = __webpack_require__(13).parseSpec,
	    TMViz = __webpack_require__(10),
	    watchInit = __webpack_require__(16).watchInit,
	    values = __webpack_require__(6).values;
	
	/**
	 * Turing machine simulator component.
	 *
	 * Contains a state diagram, tape diagram, and button controls.
	 * @param {[type]} container [description]
	 * @param {[type]} buttons   [description]
	 */
	function TMSimulator(container, buttons) {
	  this.container = container;
	  this.buttons = buttons;
	
	  var self = this;
	  buttons.step
	      .addEventListener('click', function () {
	        self.machine.isRunning = false;
	        self.machine.step(); // each step click corresponds to 1 machine step
	      });
	  buttons.run
	      .addEventListener('click', function () {
	        self.machine.isRunning = !self.machine.isRunning;
	      });
	  buttons.reset
	      .addEventListener('click', function () {
	        self.machine.reset();
	      });
	  buttons.all = values(buttons);
	
	  this.clear();
	}
	
	TMSimulator.prototype.clear = function () {
	  this.sourceCode = null;
	};
	
	Object.defineProperties(TMSimulator.prototype, {
	  /**
	   * The machine's source code.
	   * • Setting a new source code will attempt to persist the state node positions.
	   * • To set a new machine, first call .clear(), then set the source code.
	   */
	  sourceCode: {
	    get: function () {
	      return this.__sourceCode;
	    },
	    // throws if sourceCode has errors
	    set: function (sourceCode) {
	      if (this.machine) {
	        this.machine.isRunning = false; // important
	        this.machine.stateviz.force.stop();
	      }
	      if (sourceCode == null) {
	        // clear display
	        this.machine = null;
	        this.container.innerHTML = '';
	      } else {
	        // parse & check, then set
	        var spec = parseSpec(sourceCode);
	        if (this.machine) {
	          // case: update
	          // copy & restore positions, clear & load contents
	          var posTable = this.machine.positionTable;
	          this.clear();
	          this.machine = new TMViz(this.container, spec, posTable);
	        } else {
	          // case: load new
	          this.machine = new TMViz(this.container, spec);
	        }
	      }
	      this.__sourceCode = sourceCode;
	      this.__spec = spec;
	    },
	    enumerable: true
	  },
	  spec: {
	    get: function () {
	      return this.__spec;
	    }
	  },
	  positionTable: {
	    get: function () {
	      return this.machine && this.machine.positionTable;
	    },
	    set: function (posTable) {
	      if (this.machine && posTable) {
	        this.machine.positionTable = posTable;
	      }
	    },
	    enumerable: true
	  },
	  machine: {
	    get: function () {
	      return this.__machine;
	    },
	    set: function (machine) {
	      this.__machine = machine;
	      this.rebindButtons();
	    }
	  }
	});
	
	/////////////
	// Buttons //
	/////////////
	
	/**
	 * The innerHTML for the "Run" button.
	 * The default value can be overridden.
	 * @type {string}
	 */
	TMSimulator.prototype.htmlForRunButton =
	  '<span class="glyphicon glyphicon-play" aria-hidden="true"></span><br>Run';
	TMSimulator.prototype.htmlForPauseButton =
	  '<span class="glyphicon glyphicon-pause" aria-hidden="true"></span><br>Pause';
	
	// bind: .disabled for Step and Run, and .innerHTML (Run/Pause) for Run
	function rebindStepRun(stepButton, runButton, runHTML, pauseHTML, machine) {
	  function onHaltedChange(isHalted) {
	    stepButton.disabled = isHalted;
	    runButton.disabled = isHalted;
	  }
	  function onRunningChange(isRunning) {
	    runButton.innerHTML = isRunning ? pauseHTML : runHTML;
	  }
	  watchInit(machine, 'isHalted', function (prop, oldval, isHalted) {
	    onHaltedChange(isHalted);
	    return isHalted;
	  });
	  watchInit(machine, 'isRunning', function (prop, oldval, isRunning) {
	    onRunningChange(isRunning);
	    return isRunning;
	  });
	}
	
	// internal method.
	TMSimulator.prototype.rebindButtons = function () {
	  var buttons = this.buttons;
	  var enable = (this.machine != null);
	  if (enable) {
	    rebindStepRun(buttons.step, buttons.run,
	      this.htmlForRunButton, this.htmlForPauseButton, this.machine);
	  }
	  buttons.all.forEach(function (b) { b.disabled = !enable; });
	};
	
	module.exports = TMSimulator;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

	var map = {
		"./_template.yaml": 21,
		"./binaryAdd.yaml": 22,
		"./binaryIncrement.yaml": 23,
		"./binaryMult.yaml": 24,
		"./busyBeaver3.yaml": 25,
		"./busyBeaver4.yaml": 26,
		"./copy1s.yaml": 27,
		"./divisibleBy3.yaml": 28,
		"./divisibleBy3Base10.yaml": 29,
		"./lengthMult.yaml": 30,
		"./matchBinaryStrings.yaml": 31,
		"./matchThreeLengths.yaml": 32,
		"./palindrome.yaml": 33,
		"./powersOfTwo.yaml": 34,
		"./repeat01.yaml": 35,
		"./unaryMult.yaml": 36
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 40;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	/**
	 * Displays a table of keyboard shortcuts.
	 */
	
	var d3 = __webpack_require__(2);
	
	function identity(x) { return x; }
	
	/**
	 * Renders a table, using three layers of list nesting: tbody, tr, td.
	 * @param  {[ [[HTML]] ]}     data
	 * @param  {HTMLTableElement} table
	 * @return {D3Selection}            D3 selection of the <tbody> elements
	 */
	function renderTable(data, table) {
	  var tbody = d3.select(table).selectAll('tbody')
	      .data(data)
	    .enter().append('tbody');
	
	  var tr = tbody.selectAll('tr')
	      .data(identity)
	    .enter().append('tr');
	
	  tr.selectAll('td')
	      .data(identity)
	    .enter().append('td')
	      .html(identity);
	
	  return tbody;
	}
	
	
	// type Key = string;
	// type KeyList = [Key];
	
	// Key -> Key
	function abbreviateKey(key) {
	  switch (key) {
	    case 'Command': return 'Cmd';
	    case 'Option':  return 'Opt';
	    case 'Up':      return '↑';
	    case 'Down':    return '↓';
	    case 'Left':    return '←';
	    case 'Right':   return '→';
	    default:        return key;
	  }
	}
	
	// KeyList -> HTML
	function keylistToHTML(keys) {
	  return keys.map(function (key) {
	    return '<kbd>' + key + '</kbd>';
	  }).join('-');
	}
	
	// Commands -> String -> KeyList
	function createGetKeylist(commands) {
	  var platform = commands.platform;
	  // workaround: some ace keybindings for Mac use Alt instead of Option
	  var altToOption = platform !== 'mac' ? identity : function (key) {
	    return (key === 'Alt') ? 'Option' : key;
	  };
	
	  return function getKeylist(name) {
	    return commands.commands[name].bindKey[platform].split('-').map(altToOption);
	  };
	}
	
	
	// Fills a <table> with some default keyboard shortcuts.
	function main(commands, table) {
	  var getKeylist = createGetKeylist(commands);
	
	  return renderTable(entries.map(function (group) {
	    return group.map(function (d) {
	      return [
	        keylistToHTML(getKeylist(d.name).map(abbreviateKey)),
	        d.desc
	      ];
	    });
	  }), table);
	}
	
	var entries = [
	  [
	    { name: 'save', desc: 'Load machine<br> <small>Save changes and load the machine.</small>' }
	  ], [
	    { name: 'togglecomment', desc: 'Toggle comment' },
	    { name: 'indent', desc: 'Indent selection' },
	    { name: 'outdent', desc: 'Unindent selection' }
	  ], [
	    { name: 'movelinesup', desc: 'Move line up' },
	    { name: 'movelinesdown', desc: 'Move line down' },
	    { name: 'duplicateSelection', desc: 'Duplicate line/selection' }
	  ], [
	    { name: 'selectMoreAfter', desc: 'Add next occurrence to selection<br> <small>Like a quick “find”. Useful for renaming things.</small>' },
	    { name: 'find', desc: 'Find' },
	    { name: 'replace', desc: 'Find and Replace' }
	  ]
	];
	
	
	exports.main = main;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	// var d3 = require('d3');
	var $ = __webpack_require__(4); // for event delegation
	
	function identity(x) { return x; }
	function head(array) { return array[0]; }
	
	/**
	 * A <table> that includes a checkbox in front of each row,
	 * and a header checkbox to (de)select all rows.
	 * @param {D3Selection<HTMLTableElement>} args.table empty table to use
	 * @param {[string]}    [args.headers] column headers
	 * @param {[[string]]}  [args.data]    table data
	 */
	function CheckboxTable(args) {
	  this.table = args.table;
	  this.headerRow = this.table.append('thead').append('tr');
	  this.tbody = this.table.append('tbody');
	  // header checkbox (selects/deselects all checkboxes)
	  var self = this;
	  this.headerCheckbox = this.headerRow
	    .append('th')
	      .attr('class', 'checkbox-cell')
	    .append('input')
	      .attr('type', 'checkbox')
	      .on('click', /* @this checkbox */ function () {
	        self.getCheckboxes().property('checked', this.checked);
	        self.onChange();
	      });
	  $(this.tbody.node()).on('click', 'tr', /* @this tr */ function (e) {
	    // treat whole <tr> as click zone
	    if (e.target.tagName !== 'INPUT') {
	      var box = this.querySelector('input[type="checkbox"]');
	      box.checked = !box.checked;
	    }
	    // update header checkbox
	    self.refresh();
	    self.onChange();
	  });
	  // content
	  args.headers && this.setHeaders(args.headers);
	  args.data && this.setData(args.data);
	}
	
	/**
	 * Set the column headers.
	 * @param {[string]} headers
	 */
	CheckboxTable.prototype.setHeaders = function (headers) {
	  var th = this.headerRow
	    .selectAll('th:not(.checkbox-cell)')
	      .data(headers);
	  th.exit().remove();
	  th.enter().append('th');
	  th.text(identity);
	};
	
	/**
	 * Set the table body data.
	 *
	 * Each row begins with a checkbox whose .value is the first cell.
	 * Rows are keyed by the first cell when updating data.
	 * @param {[[string]]} data
	 * @return this
	 */
	CheckboxTable.prototype.setData = function (data) {
	  var tr = this.tbody.selectAll('tr')
	      .data(data, head);
	  tr.exit().remove();
	  tr.enter()
	    .append('tr')
	  // checkbox at the start of each row
	    .append('td')
	      .attr('class', 'checkbox-cell')
	    .append('input')
	      .attr({
	        type: 'checkbox',
	        value: head
	      });
	  tr.order();
	  // row cells
	  var td = tr.selectAll('td:not(.checkbox-cell)')
	      .data(identity);
	  td.exit().remove();
	  td.enter().append('td');
	  td.text(identity);
	
	  return this;
	};
	
	CheckboxTable.prototype.getCheckboxes = function () {
	  return this.tbody.selectAll('input[type="checkbox"]');
	};
	
	CheckboxTable.prototype.getCheckedValues = function () {
	  return this.tbody.selectAll('input[type="checkbox"]:checked')[0]
	    .map(function (x) { return x.value; });
	};
	
	CheckboxTable.prototype.isCheckedEmpty = function () {
	  var headerBox = this.headerCheckbox.node();
	  return !(headerBox.checked || headerBox.indeterminate);
	};
	
	/**
	 * Refresh the header checkbox (called after a row checkbox is toggled).
	 */
	CheckboxTable.prototype.refresh = function () {
	  var headerBox = this.headerCheckbox.node();
	  var boxes = this.getCheckboxes();
	
	  var total = boxes.size();
	  var checked = boxes.filter(':checked').size();
	  if (checked === 0) {
	    headerBox.checked = false;
	  } else if (checked === total) {
	    headerBox.checked = true;
	  }
	  headerBox.indeterminate = (0 < checked && checked < total);
	};
	
	// configurable. called after a click toggles a row or header checkbox.
	CheckboxTable.prototype.onChange = function () {
	};
	
	module.exports = CheckboxTable;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	/* global FileReader:false */
	var Promise = __webpack_require__(8); // eslint-disable-line no-shadow
	
	// arguments are forwarded to FileReader.readAsText
	// (Blob, ?encoding) -> Promise
	function readAsText() {
	  var args = arguments;
	  return new Promise(function (resolve, reject, onCancel) {
	    var reader = new FileReader();
	    reader.addEventListener('load', function () {
	      resolve(reader.result);
	    });
	    reader.addEventListener('error', function () {
	      reject(reader.error);
	    });
	    onCancel && onCancel(function () {
	      try { reader.abort(); } catch (e) {/* */}
	    });
	
	    reader.readAsText.apply(reader, args);
	  });
	}
	
	exports.readAsText = readAsText;


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	/* eslint-env browser */
	var format = __webpack_require__(5);
	var createGist = __webpack_require__(14).createGist;
	var Clipboard = __webpack_require__(50);
	var $ = __webpack_require__(4); // for bootstrap tooltip
	
	// https://github.com/Modernizr/Modernizr/blob/master/feature-detects/a/download.js
	var canUseDownloadAttribute =
	  !window.externalHost && 'download' in document.createElement('a');
	
	// can copy to clipboard programmatically?
	var canUseCopyCommand = (function () {
	  try {
	    return document.queryCommandSupported('copy');
	  } catch (e) {
	    return false;
	  }
	}());
	
	// Add event handlers to select an HTMLInputElement's text on focus.
	function addSelectOnFocus(element) {
	  element.addEventListener('focus', function selectAll(e) {
	    e.target.select();
	  });
	  // Safari workaround
	  element.addEventListener('mouseup', function (e) {
	    e.preventDefault();
	  });
	}
	
	// Show a one-time tooltip.
	// NB. an existing title attribute overrides the tooltip options.
	function showTransientTooltip($element, options) {
	  $element.tooltip(options)
	    .tooltip('show')
	    .one('hidden.bs.tooltip', function () {
	      $element.tooltip('destroy');
	    });
	}
	
	function showCopiedTooltip(element) {
	  showTransientTooltip($(element), {title: 'Copied!', placement: 'bottom'});
	}
	
	
	///////////////////////
	// Share with GitHub //
	///////////////////////
	
	/**
	 * Generate a new gist and display a shareable link.
	 * @param  {HTMLElement} container  Container to use for displaying the link.
	 * @param  {HTMLButtonElement} button
	 * @param  {string} filename
	 * @param  {string} contents  The file contents.
	 * @return {Promise}          Cancellable promise to create the gist.
	 */
	function generateGist(container, button, filename, contents) {
	  var oldButtonText = button.textContent;
	  button.textContent = 'Loading…';
	  button.disabled = true;
	
	  var payload = {
	    files: {},
	    description: 'Turing machine for http://turingmachine.io',
	    public: true
	  };
	  payload.files[filename] = {content: contents};
	
	  return createGist(payload).then(function (response) {
	    // Show link on success
	    var id = response.id;
	    showGeneratedGist(container, 'http://turingmachine.io/?import-gist=' + id);
	  }).catch(function (reason) {
	    // Alert error on failure
	    var message = (function () {
	      var xhr = reason.xhr;
	      try {
	        return 'Response from GitHub: “' + xhr.responseJSON.message + '”';
	      } catch (e) {
	        if (xhr.status > 0) {
	          return 'HTTP status code: ' + xhr.status + ' ' + xhr.statusText;
	        } else {
	          return 'GitHub could not be reached.\nYour Internet connection may be offline.';
	        }
	      }
	    }());
	    alert('Could not create new gist.\n\n' + message);
	
	    button.disabled = false;
	    button.textContent = oldButtonText;
	  });
	}
	
	function showGeneratedGist(container, url) {
	  container.innerHTML =
	    '<input id="sharedPermalink" type="url" class="form-control" readonly>' +
	    '<button type="button" class="btn btn-default" data-clipboard-target="#sharedPermalink">' +
	    '<span class="glyphicon glyphicon-copy" aria-hidden="true"></span>' +
	    '</button>';
	  var urlInput = container.querySelector('input');
	  urlInput.value = url;
	  urlInput.size = url.length + 2;
	  addSelectOnFocus(urlInput);
	  urlInput.focus();
	}
	
	function createGenerateGistButton(container) {
	  container.innerHTML =
	  '<button type="button" class="btn btn-default">Create permalink</button>' +
	  '<p class="help-block">This will create and link to a new' +
	    ' <a href="https://help.github.com/articles/creating-gists/#creating-an-anonymous-gist"' +
	    ' target="_blank">read-only</a> GitHub gist.' +
	  '</p>';
	  return container.querySelector('button');
	}
	
	
	///////////////////
	// Download file //
	///////////////////
	
	// Create a link button if canUseDownloadAttribute, otherwise a link with instructions.
	function createDownloadLink(filename, contents) {
	  var link = document.createElement('a');
	  link.href = 'data:text/x-yaml;charset=utf-8,' + encodeURIComponent(contents);
	  link.target = '_blank';
	  link.download = filename;
	
	  if (canUseDownloadAttribute) {
	    link.textContent = 'Download document';
	    link.className = 'btn btn-primary';
	    return link;
	  } else {
	    link.textContent = 'Right-click here and choose “Save target as…” or “Download Linked File As…”';
	    var p = document.createElement('p');
	    p.innerHTML = ', <br>then name the file to end with <code>.yaml</code>';
	    p.insertBefore(link, p.firstChild);
	    return p;
	  }
	}
	
	
	////////////
	// Common //
	////////////
	
	function init(args) {
	  var $dialog = args.$dialog,
	      getCurrentDocument = args.getCurrentDocument,
	      getIsSynced = args.getIsSynced,
	      gistContainer = args.gistContainer,
	      downloadContainer = args.downloadContainer,
	      textarea = args.textarea;
	
	  if (canUseDownloadAttribute) {
	    $dialog.addClass('download-attr');
	  }
	  if (!canUseCopyCommand) {
	    $dialog.addClass('no-copycommand');
	  }
	  gistContainer.className = 'form-group form-inline';
	  addSelectOnFocus(textarea);
	
	  function setupDialog() {
	    var doc = getCurrentDocument();
	    var filename = doc.name + '.yaml';
	    var contents = format.stringifyDocument(doc);
	    var gistPromise;
	
	    // warn about unsynced changes
	    var $alert;
	    if (!getIsSynced()) {
	      $alert = $(
	        '<div class="alert alert-warning" role="alert">' +
	        'The code editor has <strong>unsynced changes</strong> and might not correspond with the diagram.<br>' +
	        'Click <q>Load machine</q> to try to sync them. Otherwise, two sets of code will be exported.' +
	        '</div>'
	      ).prependTo($dialog.find('.modal-body'));
	    }
	
	    createGenerateGistButton(gistContainer).addEventListener('click', function (e) {
	      gistPromise = generateGist(gistContainer, e.target, filename, contents);
	    });
	
	    // "Download document" button link
	    downloadContainer.appendChild(createDownloadLink(filename, contents));
	    // <textarea> for document contents
	    textarea.value = contents;
	
	    var clipboard = new Clipboard('[data-clipboard-target]');
	    clipboard.on('success', function (e) {
	      showCopiedTooltip(e.trigger);
	      e.clearSelection();
	    });
	
	    // return cleanup function
	    return function () {
	      if (gistPromise) {
	        try { gistPromise.cancel(); } catch (e) {/* */}
	      }
	      if ($alert) { $alert.remove(); }
	      gistContainer.textContent = '';
	      downloadContainer.textContent = '';
	      textarea.value = '';
	      clipboard.destroy();
	    };
	  }
	
	  $dialog.on('show.bs.modal', function () {
	    var cleanup = setupDialog();
	    $dialog.one('hidden.bs.modal', cleanup);
	  });
	  $dialog.on('shown.bs.modal', function () {
	    // workaround "Copy to clipboard" .focus() scrolling down to <textarea>
	    // note: doesn't work when <textarea> is completely out of view
	    textarea.setSelectionRange(0,0);
	  });
	}
	
	exports.init = init;


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	/* global document: false */
	var docimport = __webpack_require__(15);
	var format = __webpack_require__(5);
	var _ = __webpack_require__(1);
	var d3 = __webpack_require__(2);
	
	// Init the import panel and attach event handlers
	// {$dialog: jQuery, gistIDForm: HTMLFormElement, importArgs: Object} -> void
	function init(args) {
	  var $dialog = args.$dialog,
	      gistIDForm = args.gistIDForm,
	      importArgs = args.importArgs;
	
	  function hideDialog() {
	    $dialog.modal('hide');
	    // Workaround needed for opening another modal before a modal is done hiding.
	    // Without this, the <body> scrolls instead of the modal:
	    // modal2.show locks body scroll => modal1.hidden unlocks body scroll
	    // while modal2 is still open.
	    var nextDialog = importArgs.dialogNode;
	    $dialog.one('hidden.bs.modal', function () {
	      if (nextDialog.classList.contains('in')) {
	        document.body.classList.add('modal-open');
	      }
	    });
	  }
	
	  // Panel: From GitHub gist
	  gistIDForm.addEventListener('submit', function (e) {
	    e.preventDefault();
	    hideDialog();
	
	    var gistID = gistIDForm.querySelector('input[type="text"]').value;
	    docimport.importGist(_.assign({gistID: gistID}, importArgs));
	  });
	
	  // Panel: From files
	  (function () {
	    // TODO: factor out element IDs and containers into interface
	    var panelBody = document.querySelector('#importFilesPanel > .panel-body');
	    // <input type="file">
	    var fileInput = panelBody.querySelector('input[type="file"]');
	    var importFilesButton = document.getElementById('importFilesButton');
	    importFilesButton.addEventListener('click', function () {
	      hideDialog();
	      docimport.importLocalFiles(_.assign({files: fileInput.files}, importArgs));
	    });
	    // <textarea>
	    var textarea = panelBody.querySelector('textarea');
	    var importContentsButton = document.getElementById('importContentsButton');
	    importContentsButton.parentNode.style.position = 'relative';
	    importContentsButton.addEventListener('click', function (e) {
	      if (importDocumentContents(
	        { containers: {status: e.target.parentNode, details: panelBody },
	          importDocument: importArgs.importDocument },
	        textarea.value
	      )) {
	        textarea.select();
	      }
	    });
	  }());
	}
	
	///////////////////////////////
	// Import from pasted string //
	///////////////////////////////
	
	// () -> HTMLButtonElement
	function createCloseIcon() {
	  return d3.select(document.createElement('button'))
	      .attr({class: 'close', 'aria-label': 'Close'})
	      .html('<span aria-hidden="true">&times;</span>')
	    .node();
	}
	
	// Show import outcome (success/failure) and error (if any)
	// ({status: HTMLElement, details: HTMLElement}, ?Error) -> void
	function showImportContentOutcome(containers, error) {
	  var statusContainer = d3.select(containers.status),
	      detailsContainer = d3.select(containers.details);
	  statusContainer.selectAll('[role="alert"]').remove();
	  detailsContainer.selectAll('.alert').remove();
	  var status = statusContainer.append('span')
	      .attr({role: 'alert'})
	      .style({
	        position: 'absolute', left: 0, width: '40%', // center between left and button
	        top: '50%', transform: 'translateY(-60%)' // center vertically
	      });
	
	  // () -> string
	  function showErrorDetails() {
	    var details = detailsContainer.append('div')
	        .attr({role: 'alert', class: 'alert alert-danger'})
	        .style('margin-top', '1em');
	    details.append(createCloseIcon)
	        .attr('data-dismiss', 'alert')
	        .on('click', function () {
	          status.remove(); // dismiss details => also dismiss status
	        });
	    if (error instanceof format.YAMLException) {
	      details.append('h4').text('Not valid YAML'); // only ".alert h4" has margin-top: 0
	      details.append('pre').text(error.message);
	    } else if (error instanceof format.InvalidDocumentError) {
	      details.append('span')
	          .text(error.message.replace(/\.?$/, '.')); // add period if missing
	    } else {
	      details.append('h4').text('Unexpected error');
	      details.append('pre').text(String(error));
	      return 'Import failed';
	    }
	    return 'Not a valid document';
	  }
	
	  if (error) {
	    var statusSummary = showErrorDetails();
	    status.attr({class: 'text-danger'})
	        .html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> '
	                + statusSummary);
	  } else {
	    status.attr({class: 'text-success'})
	        .html('<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> '
	                + 'Import succeeded')
	      .transition()
	        .delay(2500)
	        .duration(2000)
	        .style('opacity', 0)
	        .remove();
	  }
	}
	
	// returns true if import succeeded
	function importDocumentContents(opts, content) {
	  var containers = opts.containers,
	      importDocument = opts.importDocument;
	
	  var error = (function () {
	    try {
	      importDocument(format.parseDocument(content));
	    } catch (e) {
	      return e;
	    }
	  }());
	  showImportContentOutcome(containers, error);
	  return (error == null);
	}
	
	exports.init = init;


/***/ }),
/* 46 */,
/* 47 */,
/* 48 */,
/* 49 */,
/* 50 */
/***/ (function(module, exports) {

	module.exports = Clipboard;

/***/ })
]);
//# sourceMappingURL=main.bundle.js.map