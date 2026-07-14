import { createRequire } from "node:module";
import { BrowserWindow, app, ipcMain } from "electron";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();
//#endregion
//#region node_modules/ping/lib/builder/linux.js
var require_linux$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$8 = __require("util");
	/**
	* A builder builds command line arguments for ping in linux environment
	* @module ping/builder/linux
	* @exports builder
	*/
	var builder = {};
	/**
	* Default configuration for Linux ping
	* @type {import('../index').PingConfig}
	*/
	var defaultConfig = {
		numeric: true,
		timeout: 2,
		deadline: false,
		min_reply: 1,
		v6: false,
		sourceAddr: "",
		packetSize: 56,
		extra: []
	};
	/**
	* Get the finalized array of command line arguments
	* @param {string} target - hostname or ip address
	* @param {import('../index').PingConfig} [config] - Configuration object for cmd line argument
	* @return {string[]} - Command line argument according to the configuration
	*/
	builder.getCommandArguments = function(target, config) {
		/** @type {import('../index').PingConfig} */
		var _config = config || {};
		var ret = [];
		[
			"numeric",
			"timeout",
			"deadline",
			"min_reply",
			"v6",
			"sourceAddr",
			"extra",
			"packetSize"
		].forEach(function(k) {
			if (typeof _config[k] !== "boolean") _config[k] = _config[k] || defaultConfig[k];
		});
		if (_config.numeric) ret.push("-n");
		if (_config.timeout) ret = ret.concat(["-W", util$8.format("%d", _config.timeout)]);
		if (_config.deadline) ret = ret.concat(["-w", util$8.format("%d", _config.deadline)]);
		if (_config.min_reply) ret = ret.concat(["-c", util$8.format("%d", _config.min_reply)]);
		if (_config.sourceAddr) ret = ret.concat(["-I", util$8.format("%s", _config.sourceAddr)]);
		if (_config.packetSize) ret = ret.concat(["-s", util$8.format("%d", _config.packetSize)]);
		if (_config.extra) ret = ret.concat(_config.extra);
		ret.push(target);
		return ret;
	};
	/**
	* @typedef {Object} LinuxSpawnOptions
	* @property {boolean} shell - Whether to run command inside of a shell
	* @property {Object} env - Environment key-value pairs with LANG set to 'C'
	*/
	/**
	* Compute an option object for child_process.spawn
	* @return {LinuxSpawnOptions} - Options object for child_process.spawn on Linux
	*/
	builder.getSpawnOptions = function() {
		return {
			shell: false,
			env: Object.assign({}, process.env, { LANG: "C" })
		};
	};
	module.exports = builder;
}));
//#endregion
//#region node_modules/ping/lib/builder/mac.js
var require_mac$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$7 = __require("util");
	/**
	* A builder builds command line arguments for ping in mac environment
	* @module ping/builder/mac
	* @exports builder
	*/
	var builder = {};
	/**
	* Default configuration for Linux ping
	* @type {import('../index').PingConfig}
	*/
	var defaultConfig = {
		numeric: true,
		timeout: 2,
		deadline: false,
		min_reply: 1,
		v6: false,
		sourceAddr: "",
		packetSize: 56,
		extra: []
	};
	/**
	* Get the finalized array of command line arguments
	* @param {string} target - hostname or ip address
	* @param {import('../index').PingConfig} [config] - Configuration object for cmd line argument
	* @return {string[]} - Command line argument according to the configuration
	* @throws {Error} If there are errors on building arguments with given inputs
	*/
	builder.getCommandArguments = function(target, config) {
		/** @type {import('../index').PingConfig} */
		var _config = config || {};
		var ret = [];
		[
			"numeric",
			"timeout",
			"deadline",
			"min_reply",
			"v6",
			"sourceAddr",
			"extra",
			"packetSize"
		].forEach(function(k) {
			if (typeof _config[k] !== "boolean") _config[k] = _config[k] || defaultConfig[k];
		});
		if (_config.numeric) ret.push("-n");
		if (_config.timeout) {
			if (config.v6) throw new Error("There is no timeout option on ping6");
			ret = ret.concat(["-W", util$7.format("%d", _config.timeout * 1e3)]);
		}
		if (_config.deadline) ret = ret.concat(["-t", util$7.format("%d", _config.deadline)]);
		if (_config.min_reply) ret = ret.concat(["-c", util$7.format("%d", _config.min_reply)]);
		if (_config.sourceAddr) ret = ret.concat(["-S", util$7.format("%s", _config.sourceAddr)]);
		if (_config.packetSize) ret = ret.concat(["-s", util$7.format("%d", _config.packetSize)]);
		if (_config.extra) ret = ret.concat(_config.extra);
		ret.push(target);
		return ret;
	};
	/**
	* Compute an option object for child_process.spawn
	* @return {{}}
	*/
	builder.getSpawnOptions = function() {
		return {};
	};
	module.exports = builder;
}));
//#endregion
//#region node_modules/ping/lib/builder/win.js
var require_win$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$6 = __require("util");
	/**
	* A builder builds command line arguments for ping in window environment
	* @module ping/builder/win
	* @exports builder
	*/
	var builder = {};
	/**
	* Default configuration for Window ping
	* @type {import('../index').PingConfig}
	*/
	var defaultConfig = {
		numeric: true,
		timeout: 5,
		min_reply: 1,
		v6: false,
		sourceAddr: "",
		packetSize: 32,
		extra: []
	};
	/**
	* Get the finalized array of command line arguments
	* @param {string} target - hostname or ip address
	* @param {import('../index').PingConfig} [config] - Configuration object for cmd line argument
	* @return {string[]} - Command line argument according to the configuration
	*/
	builder.getCommandArguments = function(target, config) {
		/** @type {import('../index').PingConfig} */
		var _config = config || {};
		var ret = [];
		[
			"numeric",
			"timeout",
			"min_reply",
			"v6",
			"sourceAddr",
			"extra",
			"packetSize"
		].forEach(function(k) {
			if (typeof _config[k] !== "boolean") _config[k] = _config[k] || defaultConfig[k];
		});
		ret.push(_config.v6 ? "-6" : "-4");
		if (!_config.numeric) ret.push("-a");
		if (_config.timeout) ret = ret.concat(["-w", util$6.format("%d", _config.timeout * 1e3)]);
		if (_config.deadline) throw new Error("There is no deadline option on windows");
		if (_config.min_reply) ret = ret.concat(["-n", util$6.format("%d", _config.min_reply)]);
		if (_config.sourceAddr) ret = ret.concat(["-S", util$6.format("%s", _config.sourceAddr)]);
		if (_config.packetSize) ret = ret.concat(["-l", util$6.format("%d", _config.packetSize)]);
		if (_config.extra) ret = ret.concat(_config.extra);
		ret.push(target);
		return ret;
	};
	/**
	* @typedef {Object} WindowsSpawnOptions
	* @property {boolean} windowsHide - Hide the subprocess console window that would normally be created on Windows
	* systems
	*/
	/**
	* Compute an option object for child_process.spawn
	* @return {WindowsSpawnOptions} - Options object for child_process.spawn on Windows
	*/
	builder.getSpawnOptions = function() {
		return { windowsHide: true };
	};
	module.exports = builder;
}));
//#endregion
//#region node_modules/ping/lib/builder/factory.js
var require_factory$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$5 = __require("util");
	var linuxBuilder = require_linux$1();
	var macBuilder = require_mac$1();
	var winBuilder = require_win$1();
	/**
	* A factory to create a builder for building cli arguments
	* @module ping/builder/factory
	* @exports factory
	*/
	var factory = {};
	/**
	* Check out linux platform
	* @param {string} p - Platform name to check
	* @return {boolean} - True if platform is Linux-based, false otherwise
	*/
	factory.isLinux = function(p) {
		return [
			"aix",
			"android",
			"linux"
		].indexOf(p) >= 0;
	};
	/**
	* Check out macos platform
	* @param {string} p - Platform name to check
	* @return {boolean} - True if platform is macos-based, false otherwise
	*/
	factory.isMacOS = function(p) {
		return ["darwin", "freebsd"].indexOf(p) >= 0;
	};
	/**
	* Check out window platform
	* @param {string} p - Platform name to check
	* @return {boolean} - True if platform is window-based, false otherwise
	*/
	factory.isWindow = function(p) {
		return p && p.match(/^win/) !== null;
	};
	/**
	* Check whether given platform is supported
	* @param {string} p - Name of the platform
	* @return {boolean} - True or False
	*/
	factory.isPlatformSupport = function(p) {
		return this.isWindow(p) || this.isLinux(p) || this.isMacOS(p);
	};
	/**
	* Return a path to the ping executable in the system
	* @param {string} platform - Name of the platform
	* @param {boolean} v6 - Ping via ipv6 or not
	* @return {string} - Executable path for system command ping
	* @throws {Error} if given platform is not supported
	*/
	factory.getExecutablePath = function(platform, v6) {
		if (!this.isPlatformSupport(platform)) throw new Error(util$5.format("Platform |%s| is not support", platform));
		var ret = null;
		if (platform === "aix") ret = "/usr/sbin/ping";
		else if (factory.isLinux(platform)) ret = v6 ? "ping6" : "ping";
		else if (factory.isWindow(platform)) ret = process.env.SystemRoot + "/system32/ping.exe";
		else if (factory.isMacOS(platform)) ret = v6 ? "/sbin/ping6" : "/sbin/ping";
		return ret;
	};
	/**
	* @typedef {typeof linuxBuilder} LinuxBuilder
	* @typedef {typeof winBuilder} WindowsBuilder
	* @typedef {typeof macBuilder} MacBuilder
	*/
	/**
	* Create a builder
	* @param {string} platform - Name of the platform
	* @return {LinuxBuilder|WindowsBuilder|MacBuilder} - Argument builder
	* @throws {Error} if given platform is not supported
	*/
	factory.createBuilder = function(platform) {
		if (!this.isPlatformSupport(platform)) throw new Error(util$5.format("Platform |%s| is not support", platform));
		var ret = null;
		if (factory.isLinux(platform)) ret = linuxBuilder;
		else if (factory.isWindow(platform)) ret = winBuilder;
		else if (factory.isMacOS(platform)) ret = macBuilder;
		return ret;
	};
	module.exports = factory;
}));
//#endregion
//#region node_modules/ping/lib/parser/base.js
var require_base = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Parsed response
	* @typedef {object} PingResponse
	* @property  {string} inputHost - The input IP address or HOST
	* @property  {string} host - The input IP address or HOST
	* @property  {string} numeric_host - Target IP address
	* @property  {boolean} alive - True for existed host
	* @property  {string} output - Raw stdout from system ping
	* @property  {number} time - Time (float) in ms for first successful ping response
	* @property  {string} min - Minimum time for collection records
	* @property  {string} max - Maximum time for collection records
	* @property  {string} avg - Average time for collection records
	* @property  {number} packetLoss - Packet Losses in percent (number)
	* @property  {string} stddev - Standard deviation time for collected records
	*/
	/**
	* Base parser for ping output
	* @module ping/parser/base
	* @exports Parser
	*/
	/**
	* Parser constructor
	* @class Parser
	* @param {string} addr - Hostname or ip addres
	* @param {import('../index').PingConfig} config - Config object in probe()
	*/
	function Parser(addr, config) {
		this._state = 0;
		/**
		* Initial cache for response
		* @type {PingResponse}
		*/
		this._response = {
			inputHost: addr,
			host: "unknown",
			alive: false,
			output: "unknown",
			time: "unknown",
			times: [],
			min: "unknown",
			max: "unknown",
			avg: "unknown",
			stddev: "unknown",
			packetLoss: "unknown"
		};
		this._times = [];
		this._lines = [];
		this._stripRegex = /[ ]*\r?\n?$/g;
		this._pingConfig = config || {};
	}
	/**
	* Enum for parser states
	* @readonly
	* @enum {number}
	*/
	Parser.STATES = {
		INIT: 0,
		HEADER: 1,
		BODY: 2,
		FOOTER: 3,
		END: 4
	};
	/**
	* Change state of this parser
	* @param {number} state - parser.STATES
	* @return {Parser} - This instance
	*/
	Parser.prototype._changeState = function(state) {
		if (Object.keys(Parser.STATES).map(function(key) {
			return Parser.STATES[key];
		}, this).indexOf(state) < 0) throw new Error("Unknown state");
		this._state = state;
		return this;
	};
	/**
	* Process output's header
	* @param {string} line - A line from system ping
	*/
	Parser.prototype._processHeader = function(line) {
		throw new Error("Subclass should implement this method");
	};
	/**
	* Process output's body
	* @param {string} line - A line from system ping
	*/
	Parser.prototype._processBody = function(line) {
		throw new Error("Subclass should implement this method");
	};
	/**
	* Process output's footer
	* @param {string} line - A line from system ping
	*/
	Parser.prototype._processFooter = function(line) {
		throw new Error("Subclass should implement this method");
	};
	/**
	* Process a line from system ping
	* @param {string} line - A line from system ping
	* @return {Parser} - This instance
	*/
	Parser.prototype.eat = function(line) {
		var headerStates = [Parser.STATES.INIT, Parser.STATES.HEADER];
		this._lines.push(line);
		var _line = line.replace(this._stripRegex, "");
		if (_line.length === 0) {} else if (headerStates.indexOf(this._state) >= 0) this._processHeader(_line);
		else if (this._state === Parser.STATES.BODY) this._processBody(_line);
		else if (this._state === Parser.STATES.FOOTER) this._processFooter(_line);
		else if (this._state === Parser.STATES.END) {} else throw new Error("Unknown state");
		return this;
	};
	/**
	* Get results after parsing certain lines from system ping
	* @return {PingResponse} - Response from parsing ping output
	*/
	Parser.prototype.getResult = function() {
		var ret = Object.assign({}, this._response);
		ret.output = this._lines.join("\n");
		ret.alive = this._times.length > 0;
		if (ret.alive) {
			this._response.time = this._times[0];
			ret.time = this._response.time;
			this._response.times = this._times;
			ret.times = this._response.times;
		}
		if (ret.stddev === "unknown" && ret.alive) {
			var numberOfSamples = this._times.length;
			var variances = this._times.reduce(function(memory, time) {
				var differenceFromMean = time - ret.avg;
				return memory + differenceFromMean * differenceFromMean;
			}, 0) / numberOfSamples;
			ret.stddev = Math.round(Math.sqrt(variances) * 1e3) / 1e3;
		}
		[
			"min",
			"avg",
			"max",
			"stddev",
			"packetLoss"
		].forEach(function(key) {
			var v = ret[key];
			if (typeof v === "number") ret[key] = v.toFixed(3);
		});
		return ret;
	};
	module.exports = Parser;
}));
//#endregion
//#region node_modules/ping/lib/utils.js
/**
* Utilities for ping module
* @module ping/utils
*/
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Convert a value to float or 'unknown' if not a number
	* @param {string} value - Value to convert
	* @returns {number|string} Converted float or 'unknown' string if NaN
	*/
	function getFloatOrUnknown(value) {
		var parsed = parseFloat(value);
		if (isNaN(parsed)) return "unknown";
		return parsed;
	}
	module.exports = { getFloatOrUnknown };
}));
//#endregion
//#region node_modules/ping/lib/parser/win.js
var require_win = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$4 = __require("util");
	var base = require_base();
	var { getFloatOrUnknown } = require_utils();
	/**
	* @module ping/parser/win
	*/
	/**
	* @class WinParser
	* @param {string} addr - Hostname or ip addres
	* @param {import('../index').PingConfig} config - Config object in probe()
	*/
	function WinParser(addr, config) {
		base.call(this, addr, config);
		this._ipv4Regex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
	}
	util$4.inherits(WinParser, base);
	/**
	* Process output's header
	* @param {string} line - A line from system ping
	*/
	WinParser.prototype._processHeader = function(line) {
		var isPingNumeric = line.indexOf("[") === -1;
		var tokens = line.split(" ");
		if (isPingNumeric) {
			this._response.host = tokens.find(function(t) {
				return this._ipv4Regex.test(t);
			}, this);
			this._response.numeric_host = this._response.host;
		} else {
			var numericHost = tokens.find(function(t) {
				return t.indexOf("[") !== -1;
			}, this);
			var numericHostIndex = tokens.indexOf(numericHost);
			var match = /\[(.*)\]/.exec(numericHost);
			if (match) this._response.numeric_host = match[1];
			else this._response.numeric_host = "NA";
			this._response.host = tokens[numericHostIndex - 1];
		}
		this._changeState(base.STATES.BODY);
	};
	/**
	* Process ipv6 output's body
	* @param {string} line - A line from system ping
	*/
	WinParser.prototype._processIPV6Body = function(line) {
		var tokens = line.split(" ");
		var dataFields = tokens.filter(function(token) {
			return token.indexOf("=") >= 0 || token.indexOf("<") >= 0;
		});
		dataFields = dataFields.map(function(dataField) {
			var ret = dataField;
			var nextIndex = tokens.indexOf(dataField) + 1;
			if (nextIndex < tokens.length) {
				if (tokens[nextIndex] === "ms") ret += "ms";
			}
			return ret;
		});
		if (dataFields.length >= 1) {
			var timeKVP = dataFields.find(function(dataField) {
				return dataField.search(/(ms|мс)/i) >= 0;
			});
			var match = /([0-9.]+)/.exec(timeKVP);
			this._times.push(getFloatOrUnknown(match[1]));
		}
	};
	/**
	* Process ipv4 output's body
	* @param {string} line - A line from system ping
	*/
	WinParser.prototype._processIPV4Body = function(line) {
		var byteTimeTTLFields = line.split(" ").filter(function(token) {
			return token.indexOf("=") >= 0 || token.indexOf("<") >= 0;
		});
		if (byteTimeTTLFields.length >= 3) {
			var packetSize = this._pingConfig.packetSize;
			var byteField = byteTimeTTLFields.find(function(dataField) {
				var packetSizeToken = util$4.format("=%d", packetSize);
				return dataField.indexOf(packetSizeToken) >= 0;
			});
			var timeKVP = byteTimeTTLFields[byteTimeTTLFields.indexOf(byteField) + 1];
			var match = /([0-9.]+)/.exec(timeKVP);
			this._times.push(getFloatOrUnknown(match[1]));
		}
	};
	/**
	* Process output's body
	* @param {string} line - A line from system ping
	*/
	WinParser.prototype._processBody = function(line) {
		if (line.slice(-1) === ":") {
			this._changeState(base.STATES.FOOTER);
			return;
		}
		if (this._pingConfig.v6) this._processIPV6Body(line);
		else this._processIPV4Body(line);
	};
	/**
	* Process output's footer
	* @param {string} line - A line from system ping
	*/
	WinParser.prototype._processFooter = function(line) {
		var packetLoss = line.match(/([\d.]+)%/);
		if (packetLoss) this._response.packetLoss = getFloatOrUnknown(packetLoss[1]);
		if (line.search(/(ms|мсек)/i) >= 0) {
			var regExp = /([0-9.]+)/g;
			var m1 = regExp.exec(line);
			var m2 = regExp.exec(line);
			var m3 = regExp.exec(line);
			if (m1 && m2 && m3) {
				this._response.min = getFloatOrUnknown(m1[1]);
				this._response.max = getFloatOrUnknown(m2[1]);
				this._response.avg = getFloatOrUnknown(m3[1]);
				this._changeState(base.STATES.END);
			}
		}
	};
	module.exports = WinParser;
}));
//#endregion
//#region node_modules/ping/lib/parser/mac.js
var require_mac = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$3 = __require("util");
	var base = require_base();
	var { getFloatOrUnknown } = require_utils();
	/**
	* @module ping/parser/mac
	*/
	/**
	* @class MacParser
	* @param {string} addr - Hostname or ip addres
	* @param {import('../index').PingConfig} config - Config object in probe()
	*/
	function MacParser(addr, config) {
		base.call(this, addr, config);
	}
	util$3.inherits(MacParser, base);
	/**
	* Process output's header
	* @param {string} line - A line from system ping
	*/
	MacParser.prototype._processHeader = function(line) {
		var tokens = line.split(" ");
		this._response.host = tokens[1];
		this._response.numeric_host = tokens[2].slice(1, -2);
		this._changeState(base.STATES.BODY);
	};
	/**
	* Process output's body
	* @param {string} line - A line from system ping
	*/
	MacParser.prototype._processBody = function(line) {
		if ((line.match(/=/g) || []).length >= 3) {
			var match = /([0-9.]+)[ ]*ms/.exec(line);
			this._times.push(getFloatOrUnknown(match[1]));
		}
		if (line.indexOf("---") >= 0) this._changeState(base.STATES.FOOTER);
	};
	/**
	* Process output's footer
	* @param {string} line - A line from system ping
	*/
	MacParser.prototype._processFooter = function(line) {
		var packetLoss = line.match(/ ([\d.]+(\.?[\d]*))%/);
		if (packetLoss) this._response.packetLoss = getFloatOrUnknown(packetLoss[1]);
		if ((line.match(/[/]/g) || []).length >= 3) {
			var regExp = /(([0-9.]+)|nan)/g;
			var m1 = regExp.exec(line);
			var m2 = regExp.exec(line);
			var m3 = regExp.exec(line);
			var m4 = regExp.exec(line);
			if (m1 && m2 && m3 && m4) {
				this._response.min = getFloatOrUnknown(m1[1]);
				this._response.avg = getFloatOrUnknown(m2[1]);
				this._response.max = getFloatOrUnknown(m3[1]);
				this._response.stddev = getFloatOrUnknown(m4[1]);
				this._changeState(base.STATES.END);
			}
			this._changeState(base.STATES.END);
		}
	};
	module.exports = MacParser;
}));
//#endregion
//#region node_modules/ping/lib/parser/linux.js
var require_linux = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$2 = __require("util");
	var base = require_base();
	var MacParser = require_mac();
	/**
	* @module ping/parser/linux
	*/
	/**
	* @class LinuxParser
	* @param {string} addr - Hostname or ip addres
	* @param {import('../index').PingConfig} config - Config object in probe()
	*/
	function LinuxParser(addr, config) {
		base.call(this, addr, config);
	}
	util$2.inherits(LinuxParser, base);
	/**
	* Process output's body
	* @param {string} line - A line from system ping
	*/
	LinuxParser.prototype._processHeader = function(line) {
		var tokens = line.split(" ");
		var isProbablyIPv4 = tokens[1].indexOf("(") === -1;
		var ipv4Regex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
		if (isProbablyIPv4) {
			this._response.host = tokens[1];
			var ipv4Match = tokens[2].match(ipv4Regex);
			this._response.numeric_host = ipv4Match ? ipv4Match[1] : tokens[2].slice(1, -1);
		} else {
			var foundAddresses = tokens.slice(1, -3).join("").match(/([^\s()]+)/g);
			this._response.host = foundAddresses.shift();
			this._response.numeric_host = foundAddresses.pop();
		}
		this._changeState(base.STATES.BODY);
	};
	/**
	* Process output's body
	* @param {string} line - A line from system ping
	*/
	LinuxParser.prototype._processBody = function(line) {
		MacParser.prototype._processBody.call(this, line);
	};
	/**
	* Process output's footer
	* @param {string} line - A line from system ping
	*/
	LinuxParser.prototype._processFooter = function(line) {
		MacParser.prototype._processFooter.call(this, line);
	};
	module.exports = LinuxParser;
}));
//#endregion
//#region node_modules/ping/lib/parser/factory.js
var require_factory = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$1 = __require("util");
	var builderFactory = require_factory$1();
	var WinParserClass = require_win();
	var MacParserClass = require_mac();
	var LinuxParserClass = require_linux();
	/**
	* A factory creates a parser for parsing output from system ping
	* @module ping/parser/factory
	*/
	var factory = {};
	/**
	* @typedef {typeof import('./linux')} LinuxParser
	* @typedef {typeof import('./win')} WinParser
	* @typedef {typeof import('./mac')} MacParser
	*/
	/**
	* Create a parser for a given platform
	* @param {string} addr - Hostname or ip address
	* @param {string} platform - Name of the platform
	* @param {PingConfig} [config] - Config object in probe()
	* @return {LinuxParserClass|WinParserClass|MacParserClass} - Parser
	* @throws {Error} If given platform is not supported
	*/
	factory.createParser = function(addr, platform, config) {
		var _config = config || {};
		if (!builderFactory.isPlatformSupport(platform)) throw new Error(util$1.format("Platform |%s| is not support", platform));
		var ret = null;
		if (builderFactory.isWindow(platform)) ret = new WinParserClass(addr, _config);
		else if (builderFactory.isMacOS(platform)) ret = new MacParserClass(addr, _config);
		else if (builderFactory.isLinux(platform)) ret = new LinuxParserClass(addr, _config);
		return ret;
	};
	module.exports = factory;
}));
//#endregion
//#region node_modules/ping/lib/ping-promise.js
var require_ping_promise = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* LICENSE MIT
	* (C) Daniel Zelisko
	* http://github.com/danielzzz/node-ping
	*
	* a simple wrapper for ping
	* Now with support of not only english Windows.
	*
	*/
	var util = __require("util");
	var net = __require("net");
	var cp = __require("child_process");
	var os = __require("os");
	var builderFactory = require_factory$1();
	var parserFactory = require_factory();
	/**
	* @module ping/ping-promise
	*/
	/**
	* @see probe
	*/
	function _probe(addr, config) {
		var _config = config || {};
		if (_config.v6 === void 0) _config.v6 = net.isIPv6(addr);
		return new Promise(function(resolve, reject) {
			var ping = null;
			var platform = os.platform();
			try {
				var argumentBuilder = builderFactory.createBuilder(platform);
				var pingExecutablePath = builderFactory.getExecutablePath(platform, _config.v6);
				var pingArgs = argumentBuilder.getCommandArguments(addr, _config);
				var spawnOptions = argumentBuilder.getSpawnOptions();
				ping = cp.spawn(pingExecutablePath, pingArgs, spawnOptions);
			} catch (err) {
				reject(err);
				return;
			}
			var parser = parserFactory.createParser(addr, platform, _config);
			ping.once("error", function() {
				reject(new Error(util.format("ping.probe: %s. %s", "there was an error while executing the ping program. ", "Check the path or permissions...")));
			});
			var outstring = [];
			ping.stdout.on("data", function(data) {
				outstring.push(String(data));
			});
			ping.stderr.on("data", function(data) {
				outstring.push(String(data));
			});
			ping.once("close", function() {
				outstring.join("").split("\n").forEach(parser.eat, parser);
				resolve(parser.getResult());
			});
		});
	}
	/**
	* Probe a host using ping command
	* @param {string} addr - Hostname or ip address
	* @param {import('./index').PingConfig} [config] - Configuration for command ping
	* @return {Promise<import('./parser/base').PingResponse>}
	*/
	function probe(addr, config) {
		try {
			return _probe(addr, config);
		} catch (error) {
			return Promise.reject(error);
		}
	}
	exports.probe = probe;
}));
//#endregion
//#region node_modules/ping/lib/ping-sys.js
var require_ping_sys = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* LICENSE MIT
	* (C) Daniel Zelisko
	* http://github.com/danielzzz/node-ping
	*
	* a simple wrapper for ping
	* Now with support of not only english Windows.
	*
	*/
	var ping = require_ping_promise();
	/**
	* @module ping/ping-sys
	*/
	/**
	* Callback after probing given host
	* @callback probeCallback
	* @param {import('./parser/base').PingResponse} response - Ping response object
	* @param {Error|null} error - Error object if error occurs, null otherwise
	*/
	/**
	* Probe a host using ping command with callback interface
	* @param {string} addr - Hostname or ip address
	* @param {probeCallback} cb - Callback
	* @param {import('./index').PingConfig} [config] - Configuration for command ping
	* @return {Promise<import('./parser/base').PingResponse>} Promise from the underlying ping operation
	*/
	function probe(addr, cb, config) {
		var _config = config || {};
		return ping.probe(addr, _config).then(function(res) {
			cb(res, null);
		}).catch(function(err) {
			cb(null, err);
		});
	}
	exports.probe = probe;
}));
//#endregion
//#region electron/main.ts
var import_lib = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Cross platform config representation
	* @typedef {Object} PingConfig
	* @property {boolean} [numeric] - Map IP address to hostname or not
	* @property {number} [timeout] - Time to wait for a response, in seconds.
	* The option affects only timeout  in  absence  of any responses,
	* otherwise ping waits for two RTTs.
	* @property {number} [deadline] - Specify a timeout, in seconds,
	* before ping exits regardless of how many packets have been sent or received.
	* In this case ping does not stop after count packet are sent,
	* it waits either for deadline expire or until count probes are answered
	* or for some error notification from network.
	* This option is only available on linux and mac.
	* @property {number} [min_reply] - Exit after sending number of ECHO_REQUEST
	* @property {boolean} [v6] - Use IPv4 (default) or IPv6
	* @property {string} [sourceAddr] - source address for sending the ping
	* @property {number} [packetSize] - Specifies the number of data bytes to be sent
	*                                 Default: Linux / MAC: 56 Bytes,
	*                                          Window: 32 Bytes
	* @property {string[]} [extra] - Optional options does not provided
	*/
	var ping = {};
	ping.sys = require_ping_sys();
	ping.promise = require_ping_promise();
	module.exports = ping;
})))(), 1);
var __dirname = dirname(fileURLToPath(import.meta.url));
var mainWindow = null;
var createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		backgroundColor: "#020617",
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
	else mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
};
app.whenReady().then(() => {
	ipcMain.handle("fetch-steam-data", async () => {
		const response = await fetch("https://api.steampowered.com/ISteamApps/GetSDRConfig/v1?appid=730");
		if (!response.ok) throw new Error("Failed to fetch Steam data");
		return await response.json();
	});
	ipcMain.handle("ping-server", async (_, ip) => {
		try {
			const result = await import_lib.default.promise.probe(ip, { timeout: 2 });
			if (result.alive && typeof result.time === "number") return Math.round(result.time);
			return 999;
		} catch {
			return 999;
		}
	});
	createWindow();
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
//#endregion
export {};
