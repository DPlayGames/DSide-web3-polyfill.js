// 이미 보관함에 의해 생성되었으면 더 이상 생성하지 않습니다.
if (window.DSide !== undefined) {
	// ignore.
}

// 만약 web3 환경도 아니라면
else if (window.web3 === undefined) {
	// ignore.
}

else {
	
	window.DSide = (() => {
		
		let TO_DELETE = null;
		
		let SHOW_ERROR = (tag, errorMsg, params) => {
			//REQUIRED: tag
			//REQUIRED: errorMsg
			//OPTIONAL: params
			
			let cal = CALENDAR();
			
			console.error(cal.getYear() + '-' + cal.getMonth(true) + '-' + cal.getDate(true) + ' ' + cal.getHour(true) + ':' + cal.getMinute(true) + ':' + cal.getSecond(true) + ' [' + tag + '] 오류가 발생했습니다. 오류 메시지: ' + errorMsg);
			
			if (params !== undefined) {
				console.error('다음은 오류를 발생시킨 파라미터입니다.');
				console.error(JSON.stringify(params, TO_DELETE, 4));
			}
		};
		
		let CHECK_IS_DATA = (target) => {
			//OPTIONAL: target
	
			if (
			target !== undefined &&
			target !== TO_DELETE &&
			CHECK_IS_ARRAY(target) !== true &&
			target instanceof Date !== true &&
			target instanceof RegExp !== true &&
			typeof target === 'object') {
				return true;
			}
	
			return false;
		};
		
		let CHECK_IS_ARRAY = (target) => {
			//OPTIONAL: target
	
			if (
			target !== undefined &&
			target !== TO_DELETE &&
			typeof target === 'object' &&
			Object.prototype.toString.call(target) === '[object Array]') {
				return true;
			}
	
			return false;
		};
		
		let EXTEND = (params) => {
			//REQUIRED: params
			//REQUIRED: params.origin	기존 데이터나 배열
			//REQUIRED: params.extend	덧붙힐 데이터나 배열
	
			let origin = params.origin;
			let extend = params.extend;
	
			if (CHECK_IS_DATA(origin) === true) {
	
				EACH(extend, (value, name) => {
					
					if ( value instanceof Date === true) {
						origin[name] = new Date(value.getTime());
					}
					
					else if ( value instanceof RegExp === true) {
						
						let pattern = value.toString();
						let flags;
						
						for (let i = pattern.length - 1; i >= 0; i -= 1) {
							if (pattern[i] === '/') {
								flags = pattern.substring(i + 1);
								pattern = pattern.substring(1, i);
								break;
							}
						}
						
						origin[name] = new RegExp(pattern, flags);
					}
					
					else if (CHECK_IS_DATA(value) === true || CHECK_IS_ARRAY(value) === true) {
						origin[name] = COPY(value);
					}
					
					else {
						origin[name] = value;
					}
				});
			}
	
			else if (CHECK_IS_ARRAY(origin) === true) {
	
				EACH(extend, (value) => {
	
					if ( value instanceof Date === true) {
						origin.push(new Date(value.getTime()));
					}
					
					else if ( value instanceof RegExp === true) {
						
						let pattern = value.toString();
						let flags;
						
						for (let i = pattern.length - 1; i >= 0; i -= 1) {
							if (pattern[i] === '/') {
								flags = pattern.substring(i + 1);
								pattern = pattern.substring(1, i);
								break;
							}
						}
						
						origin.push(new RegExp(pattern, flags));
					}
					
					else if (CHECK_IS_DATA(value) === true || CHECK_IS_ARRAY(value) === true) {
						origin.push(COPY(value));
					}
					
					else {
						origin.push(value);
					}
				});
			}
	
			return origin;
		};
		
		let COPY = (dataOrArray) => {
			//REQUIRED: dataOrArray
			
			let copy;
			
			if (CHECK_IS_DATA(dataOrArray) === true) {
	
				copy = {};
	
				EXTEND({
					origin : copy,
					extend : dataOrArray
				});
			}
	
			else if (CHECK_IS_ARRAY(dataOrArray) === true) {
	
				copy = [];
	
				EXTEND({
					origin : copy,
					extend : dataOrArray
				});
			}
	
			return copy;
		};
		
		let PACK_DATA = (data) => {
			//REQUIRED: data
	
			let result = COPY(data);
			let dateNames = [];
			let regexNames = [];
	
			EACH(result, (value, name) => {
	
				if (value instanceof Date === true) {
	
					// change to timestamp integer.
					result[name] = INTEGER(value.getTime());
					dateNames.push(name);
				}
				
				else if (value instanceof RegExp === true) {
	
					// change to string.
					result[name] = value.toString();
					regexNames.push(name);
				}
	
				else if (CHECK_IS_DATA(value) === true) {
					result[name] = PACK_DATA(value);
				}
	
				else if (CHECK_IS_ARRAY(value) === true) {
	
					EACH(value, (v, i) => {
	
						if (CHECK_IS_DATA(v) === true) {
							value[i] = PACK_DATA(v);
						}
					});
				}
			});
	
			result.__D = dateNames;
			result.__R = regexNames;
	
			return result;
		};
		
		let UNPACK_DATA = (packedData) => {
			//REQUIRED: packedData	PACK_DATA가 적용된 데이터
	
			let result = COPY(packedData);
	
			// when date property names exists
			if (result.__D !== undefined) {
	
				// change timestamp integer to Date type.
				EACH(result.__D, (dateName, i) => {
					result[dateName] = new Date(result[dateName]);
				});
				
				delete result.__D;
			}
			
			// when regex property names exists
			if (result.__R !== undefined) {
	
				// change string to RegExp type.
				EACH(result.__R, (regexName, i) => {
					
					let pattern = result[regexName];
					let flags;
					
					for (let j = pattern.length - 1; j >= 0; j -= 1) {
						if (pattern[j] === '/') {
							flags = pattern.substring(j + 1);
							pattern = pattern.substring(1, j);
							break;
						}
					}
					
					result[regexName] = new RegExp(pattern, flags);
				});
				
				delete result.__R;
			}
	
			EACH(result, (value, name) => {
	
				if (CHECK_IS_DATA(value) === true) {
					result[name] = UNPACK_DATA(value);
				}
	
				else if (CHECK_IS_ARRAY(value) === true) {
	
					EACH(value, (v, i) => {
	
						if (CHECK_IS_DATA(v) === true) {
							value[i] = UNPACK_DATA(v);
						}
					});
				}
			});
	
			return result;
		};
		
		let STRINGIFY = (data) => {
			//REQUIRED: data
			
			if (CHECK_IS_DATA(data) === true) {
				return JSON.stringify(PACK_DATA(data));
			}
			
			else if (CHECK_IS_ARRAY(data) === true) {
				
				let f = (array) => {
					
					let newArray = [];
					
					EACH(array, (data) => {
						if (CHECK_IS_DATA(data) === true) {
							newArray.push(PACK_DATA(data));
						} else if (CHECK_IS_ARRAY(data) === true) {
							newArray.push(f(data));
						} else {
							newArray.push(data);
						}
					});
					
					return newArray;
				};
				
				return JSON.stringify(f(data));
			}
			
			else {
				return JSON.stringify(data);
			}
		};
		
		let EACH = (dataOrArrayOrString, func) => {
			//OPTIONAL: dataOrArrayOrString
			//REQUIRED: func
			
			if (dataOrArrayOrString === undefined) {
				return false;
			}
	
			// when dataOrArrayOrString is data
			else if (CHECK_IS_DATA(dataOrArrayOrString) === true) {
	
				for (let name in dataOrArrayOrString) {
					if (dataOrArrayOrString.hasOwnProperty === undefined || dataOrArrayOrString.hasOwnProperty(name) === true) {
						if (func(dataOrArrayOrString[name], name) === false) {
							return false;
						}
					}
				}
			}
	
			// when dataOrArrayOrString is func
			else if (func === undefined) {
	
				func = dataOrArrayOrString;
				dataOrArrayOrString = undefined;
	
				return (dataOrArrayOrString) => {
					return EACH(dataOrArrayOrString, func);
				};
			}
	
			// when dataOrArrayOrString is array or string
			else {
	
				let length = dataOrArrayOrString.length;
	
				for (let i = 0; i < length; i += 1) {
	
					if (func(dataOrArrayOrString[i], i) === false) {
						return false;
					}
	
					// when shrink
					if (dataOrArrayOrString.length < length) {
						i -= length - dataOrArrayOrString.length;
						length -= length - dataOrArrayOrString.length;
					}
	
					// when stretch
					else if (dataOrArrayOrString.length > length) {
						length += dataOrArrayOrString.length - length;
					}
				}
			}
	
			return true;
		};
		
		let PARSE_STR = (dataStr) => {
			//REQUIRED: dataStr
			
			try {
	
				let data = JSON.parse(dataStr);
				
				if (CHECK_IS_DATA(data) === true) {
					return UNPACK_DATA(data);
				}
				
				else if (CHECK_IS_ARRAY(data) === true) {
					
					let array = [];
					
					EACH(data, (data) => {
						
						if (CHECK_IS_DATA(data) === true) {
							array.push(UNPACK_DATA(data));
						}
						
						else if (CHECK_IS_ARRAY(data) === true) {
							
							EACH(data, (v, i) => {
			
								if (CHECK_IS_DATA(v) === true) {
									data[i] = UNPACK_DATA(v);
								}
							});
							
							array.push(data);
						}
						
						else {
							array.push(data);
						}
					});
					
					return array;
				}
				
				else {
					return data;
				}
	
			} catch(e) {
	
				// when error, return undefined.
				return undefined;
			}
		};
		
		let CONNECT_TO_WEB_SOCKET_SERVER = (portOrParams, connectionListenerOrListeners) => {
			//REQUIRED: portOrParams
			//REQUIRED: portOrParams.isSecure
			//REQUIRED: portOrParams.host
			//REQUIRED: portOrParams.port
			//REQUIRED: connectionListenerOrListeners
			//REQUIRED: connectionListenerOrListeners.success
			//OPTIONAL: connectionListenerOrListeners.error
	
			let isSecure;
			let host;
			let port;
	
			let connectionListener;
			let errorListener;
			
			let isConnected;
	
			let methodMap = {};
			let sendKey = 0;
			
			let on;
			let off;
			let send;
	
			if (CHECK_IS_DATA(portOrParams) !== true) {
				port = portOrParams;
			} else {
				isSecure = portOrParams.isSecure;
				host = portOrParams.host;
				port = portOrParams.port;
			}
	
			if (CHECK_IS_DATA(connectionListenerOrListeners) !== true) {
				connectionListener = connectionListenerOrListeners;
			} else {
				connectionListener = connectionListenerOrListeners.success;
				errorListener = connectionListenerOrListeners.error;
			}
	
			let runMethods = (methodName, data, sendKey) => {
	
				let methods = methodMap[methodName];
	
				if (methods !== undefined) {
	
					EACH(methods, (method) => {
	
						// run method.
						method(data,
	
						// ret.
						(retData) => {
	
							if (send !== undefined && sendKey !== undefined) {
	
								send({
									methodName : '__CALLBACK_' + sendKey,
									data : retData
								});
							}
						});
					});
				}
			};
	
			let conn = new WebSocket((isSecure === true ? 'wss://': 'ws://') + host + ':' + port);
	
			conn.onopen = () => {
	
				isConnected = true;
	
				connectionListener(
	
				// on.
				on = (methodName, method) => {
					//REQUIRED: methodName
					//REQUIRED: method
	
					let methods = methodMap[methodName];
	
					if (methods === undefined) {
						methods = methodMap[methodName] = [];
					}
	
					methods.push(method);
				},
	
				// off.
				off = (methodName, method) => {
					//REQUIRED: methodName
					//OPTIONAL: method
	
					let methods = methodMap[methodName];
	
					if (methods !== undefined) {
	
						if (method !== undefined) {
	
							REMOVE({
								array : methods,
								value : method
							});
	
						} else {
							delete methodMap[methodName];
						}
					}
				},
	
				// send to server.
				send = (methodNameOrParams, callback) => {
					//REQUIRED: methodNameOrParams
					//REQUIRED: methodNameOrParams.methodName
					//OPTIONAL: methodNameOrParams.data
					//OPTIONAL: callback
					
					let methodName;
					let data;
					let callbackName;
					
					if (CHECK_IS_DATA(methodNameOrParams) !== true) {
						methodName = methodNameOrParams;
					} else {
						methodName = methodNameOrParams.methodName;
						data = methodNameOrParams.data;
					}
					
					if (conn !== undefined) {
						
						conn.send(STRINGIFY({
							methodName : methodName,
							data : data,
							sendKey : sendKey
						}));
		
						if (callback !== undefined) {
							
							callbackName = '__CALLBACK_' + sendKey;
		
							// on callback.
							on(callbackName, (data) => {
		
								// run callback.
								callback(data);
		
								// off callback.
								off(callbackName);
							});
						}
		
						sendKey += 1;
					}
				},
	
				// disconnect.
				() => {
					if (conn !== undefined) {
						conn.close();
						conn = undefined;
					}
				});
			};
	
			// receive data.
			conn.onmessage = (e) => {
	
				let params = PARSE_STR(e.data);
	
				if (params !== undefined) {
					runMethods(params.methodName, params.data, params.sendKey);
				}
			};
	
			// when disconnected
			conn.onclose = () => {
				runMethods('__DISCONNECTED');
			};
	
			// when error
			conn.onerror = (error) => {
	
				let errorMsg = error.toString();
	
				if (isConnected !== true) {
	
					if (errorListener !== undefined) {
						errorListener(errorMsg);
					} else {
						SHOW_ERROR('CONNECT_TO_WEB_SOCKET_SERVER', errorMsg);
					}
	
				} else {
					runMethods('__ERROR', errorMsg);
				}
			};
		};
		
		let self = {};
		
		const HARD_CODED_URLS = [
			'218.38.19.34:8923',
			'175.207.29.151:8923',
			'218.38.12.135:8923',
			'218.38.12.134:8923',
			'218.38.19.48:8923',
			'218.38.19.49:8923',
			'49.247.128.219:8923',
			'34.202.162.93:8923',
			'35.159.18.198:8923',
			'35.234.34.128:8923'
		];
		
		let networkName = 'Unknown';
		
		let setNetworkName = self.setNetworkName = (_networkName) => {
			//REQUIRED: networkName
			
			networkName = _networkName;
		};
		
		let nodeURLs;
		
		let innerSendToNode;
		let innerOnFromNode;
		let innerOffFromNode;
		let timeDiffWithNode = 0;
		
		let waitingSendInfos = [];
		let onInfos = [];
		
		let sendToNode = (methodName, data, callback) => {
			
			if (innerSendToNode === undefined) {
				
				waitingSendInfos.push({
					params : {
						methodName : methodName,
						data : data
					},
					callback : callback
				});
				
			} else {
				
				innerSendToNode({
					methodName : methodName,
					data : data
				}, callback);
			}
		};
		
		let onFromNode = (methodName, method) => {
			
			onInfos.push({
				methodName : methodName,
				method : method
			});
	
			if (innerOnFromNode !== undefined) {
				innerOnFromNode(methodName, method);
			}
		};
		
		let offFromNode = (methodName, method) => {
			
			if (innerOffFromNode !== undefined) {
				innerOffFromNode(methodName, method);
			}
			
			if (method !== undefined) {
				
				REMOVE(onInfos, (onInfo) => {
					return onInfo.methodName === methodName && onInfo.method === method;
				});
				
			} else {
				
				REMOVE(onInfos, (onInfo) => {
					return onInfo.methodName === methodName;
				});
			}
		};
		
		let connectToFastestNode = () => {
			
			let isFoundFastestNode;
			
			// 모든 노드들에 연결합니다.
			EACH(nodeURLs, (url) => {
				
				let splits = url.split(':');
				
				CONNECT_TO_WEB_SOCKET_SERVER({
					host : splits[0],
					port : parseInt(splits[1])
				}, {
					error : () => {
						// 연결 오류를 무시합니다.
					},
					success : (on, off, send, disconnect) => {
						
						if (isFoundFastestNode !== true) {
							
							send('getNodeTime', (nodeTime) => {
								
								// 가장 빠른 노드를 찾았습니다.
								if (isFoundFastestNode !== true) {
									
									innerSendToNode = send;
									innerOnFromNode = on;
									innerOffFromNode = off;
									timeDiffWithNode = Date.now() - nodeTime;
									
									// 가장 빠른 노드를 찾고 난 뒤 대기중인 내용 실행
									EACH(onInfos, (onInfo) => {
										innerOnFromNode(onInfo.methodName, onInfo.method);
									});
									
									EACH(waitingSendInfos, (sendInfo) => {
										innerSendToNode(sendInfo.params, sendInfo.callback);
									});
									
									// 노드와의 접속이 끊어지면, 모든 내용을 초기화하고 다시 가장 빠른 노드를 찾습니다.
									on('__DISCONNECTED', () => {
										
										innerSendToNode = undefined;
										innerOnFromNode = undefined;
										innerOffFromNode = undefined;
										timeDiffWithNode = 0;
										
										waitingSendInfos = [];
										onInfos = [];
										
										connectToFastestNode();
										
										isAccountSigned = false;
										
										// retry login.
										login();
									});
									
									isFoundFastestNode = true;
								}
								
								else {
									disconnect();
								}
							});
						}
						
						else {
							disconnect();
						}
					}
				});
			});
		};
		
		let isSomeNodeConnected = false;
		
		// 하드코딩된 노드들의 URL로부터 최초 접속 노드를 찾습니다.
		EACH(HARD_CODED_URLS, (url) => {
			
			let splits = url.split(':');
			
			CONNECT_TO_WEB_SOCKET_SERVER({
				host : splits[0],
				port : parseInt(splits[1])
			}, {
				error : () => {
					// 연결 오류를 무시합니다.
				},
				success : (on, off, send, disconnect) => {
					
					if (isSomeNodeConnected !== true) {
						
						// 실제로 연결된 노드 URL 목록을 가져옵니다.
						send('getNodeURLs', (urls) => {
							
							if (isSomeNodeConnected !== true) {
								
								nodeURLs = urls;
								
								connectToFastestNode();
								
								isSomeNodeConnected = true;
							}
							
							disconnect();
						});
					}
					
					else {
						disconnect();
					}
				}
			});
		});
		
		let getNodeTime = self.getNodeTime = (date) => {
			//REQUIRED: date
			
			return new Date(date.getTime() - timeDiffWithNode);
		};
		
		let seperateHandler = (callbackOrHandlers) => {
			//REQUIRED: callbackOrHandlers
			//OPTIONAL: callbackOrHandlers.notValid
			//OPTIONAL: callbackOrHandlers.notVerified
			//OPTIONAL: callbackOrHandlers.notEnoughD
			//REQUIRED: callbackOrHandlers.success
			
			let notValidHandler;
			let notVerifiedHandler;
			let notEnoughDHandler;
			let callback;
			
			if (CHECK_IS_DATA(callbackOrHandlers) !== true) {
				callback = callbackOrHandlers;
			} else {
				notValidHandler = callbackOrHandlers.notValid;
				notVerifiedHandler = callbackOrHandlers.notVerified;
				notEnoughDHandler = callbackOrHandlers.notEnoughD;
				callback = callbackOrHandlers.success;
			}
			
			return (result) => {
				
				if (result.validErrors !== undefined) {
					if (notValidHandler !== undefined) {
						notValidHandler(result.validErrors);
					} else {
						SHOW_ERROR('DSide.saveAccountDetail', MSG({
							ko : '데이터가 유효하지 않습니다.'
						}), result.validErrors);
					}
				}
				
				else if (result.isNotVerified === true) {
					if (notVerifiedHandler !== undefined) {
						notVerifiedHandler();
					} else {
						SHOW_ERROR('DSide.saveAccountDetail', MSG({
							ko : '데이터가 유효하지 않습니다.'
						}));
					}
				}
				
				else if (result.isNotEnoughD === true) {
					if (notEnoughDHandler !== undefined) {
						notEnoughDHandler();
					} else {
						SHOW_ERROR('DSide.saveAccountDetail', MSG({
							ko : 'd가 부족합니다.'
						}));
					}
				}
				
				else {
					callback();
				}
			};
		};
		
		// 계정의 세부 정보를 가져옵니다.
		let getAccountDetail = self.getAccountDetail = (accountId, callback) => {
			//REQUIRED: accountId
			//REQUIRED: callback
			
			sendToNode('getAccountDetail', accountId, callback);
		};
		
		// 이름으로 계정을 찾습니다.
		let findAccounts = self.findAccounts = (nameQuery, callback) => {
			//REQUIRED: nameQuery
			//REQUIRED: callback
			
			sendToNode('findAccounts', nameQuery, callback);
		};
		
		// 친구 신청합니다.
		let requestFriend = self.requestFriend = (targetAccountId, callbackOrHandlers) => {
			//REQUIRED: targetAccountId
			//REQUIRED: callbackOrHandlers
			//OPTIONAL: callbackOrHandlers.notValid
			//OPTIONAL: callbackOrHandlers.notVerified
			//OPTIONAL: callbackOrHandlers.notEnoughD
			//REQUIRED: callbackOrHandlers.success
			
			DPlayInventory.getAccountId((accountId) => {
				
				let data = {
					target : targetAccountId,
					accountId : accountId,
					createTime : new Date()
				};
				
				DPlayInventory.signData(data, (hash) => {
					
					sendToNode('requestFriend', {
						data : data,
						hash : hash
					}, seperateHandler(callbackOrHandlers));
				});
			});
		};
		
		// 이미 친구 신청했는지 확인합니다.
		let checkFriendRequested = self.checkFriendRequested = (params, callback) => {
			//REQUIRED: params
			//REQUIRED: params.target
			//REQUIRED: params.accountId
			//REQUIRED: callback
			
			sendToNode('checkFriendRequested', params, callback);
		};
		
		// 친구 신청자들의 ID를 가져옵니다.
		let getFriendRequesterIds = self.getFriendRequesterIds = (accountId, callback) => {
			//REQUIRED: accountId
			//REQUIRED: callback
			
			sendToNode('getFriendRequesterIds', accountId, callback);
		};
		
		// 친구 요청을 거절합니다.
		let denyFriendRequest = self.denyFriendRequest = (requesterId, callback) => {
			//REQUIRED: requesterId
			//REQUIRED: callback
			
			DPlayInventory.getAccountId((accountId) => {
				
				let data = {
					target : accountId,
					accountId : requesterId
				};
				
				DPlayInventory.signData(data, (hash) => {
					
					sendToNode('denyFriendRequest', {
						target : accountId,
						accountId : requesterId,
						hash : hash
					});
					
					callback();
				});
			});
		};
		
		// 친구 요청을 수락합니다.
		let acceptFriendRequest = self.acceptFriendRequest = (requesterId, callback) => {
			//REQUIRED: requesterId
			//REQUIRED: callback
			
			DPlayInventory.getAccountId((accountId) => {
				
				let data = {
					accountId : accountId,
					account2Id : requesterId,
					createTime : new Date()
				};
				
				DPlayInventory.signData(data, (hash) => {
					
					sendToNode('acceptFriendRequest', {
						data : data,
						hash : hash
					}, seperateHandler(callback));
				});
			});
		};
		
		// 친구들의 ID를 가져옵니다.
		let getFriendIds = self.getFriendIds = (accountId, callback) => {
			//REQUIRED: accountId
			//REQUIRED: callback
			
			sendToNode('getFriendIds', accountId, callback);
		};
		
		// 두 유저가 친구인지 확인합니다.
		let checkIsFriend = self.checkIsFriend = (params, callback) => {
			//REQUIRED: params
			//REQUIRED: params.accountId
			//REQUIRED: params.account2Id
			//REQUIRED: callback
			
			sendToNode('checkIsFriend', params, callback);
		};
		
		// 친구를 삭제합니다.
		let removeFriend = self.removeFriend = (friendId, callbackOrHandlers) => {
			//REQUIRED: friendId
			//REQUIRED: callbackOrHandlers
			//OPTIONAL: callbackOrHandlers.notValid
			//OPTIONAL: callbackOrHandlers.notVerified
			//REQUIRED: callbackOrHandlers.success
			
			DPlayInventory.signText(friendId, (hash) => {
				
				sendToNode('removeFriend', {
					friendId : friendId,
					hash : hash
				}, seperateHandler(callbackOrHandlers));
			});
		};
		
		// 회원수 순으로 길드 ID들을 가져옵니다.
		let getGuildIdsByMemberCount = self.getGuildIdsByMemberCount = (callback) => {
			//REQUIRED: callback
			
			sendToNode('getGuildIdsByMemberCount', undefined, callback);
		};
		
		// 특정 길드 정보를 가져옵니다.
		let getGuild = self.getGuild = (guildId, callback) => {
			//REQUIRED: guildId
			//REQUIRED: callback
			
			sendToNode('getGuild', guildId, callback);
		};
		
		// 특정 유저가 가입한 길드 ID를 가져옵니다.
		let getAccountGuildId = self.getAccountGuildId = (accountId, callback) => {
			//REQUIRED: accountId
			//REQUIRED: callback
			
			sendToNode('getAccountGuildId', accountId, callback);
		};
		
		// 이름으로 길드를 찾습니다.
		let findGuilds = self.findGuilds = (nameQuery, callback) => {
			//REQUIRED: nameQuery
			//REQUIRED: callback
			
			sendToNode('findGuilds', nameQuery, callback);
		};
		
		// 길드 가입 신청합니다.
		let requestGuildJoin = self.requestGuildJoin = (targetGuildId, callbackOrHandlers) => {
			//REQUIRED: targetGuildId
			//REQUIRED: callbackOrHandlers
			//OPTIONAL: callbackOrHandlers.notValid
			//OPTIONAL: callbackOrHandlers.notVerified
			//OPTIONAL: callbackOrHandlers.notEnoughD
			//REQUIRED: callbackOrHandlers.success
			
			DPlayInventory.getAccountId((accountId) => {
				
				let data = {
					target : targetGuildId,
					accountId : accountId,
					createTime : new Date()
				};
				
				DPlayInventory.signData(data, (hash) => {
					
					sendToNode('requestGuildJoin', {
						data : data,
						hash : hash
					}, seperateHandler(callbackOrHandlers));
				});
			});
		};
		
		// 이미 길드 가입 신청했는지 확인합니다.
		let checkGuildJoinRequested = self.checkGuildJoinRequested = (params, callback) => {
			//REQUIRED: params
			//REQUIRED: params.target
			//REQUIRED: params.accountId
			//REQUIRED: callback
			
			sendToNode('checkGuildJoinRequested', params, callback);
		};
		
		// 길드 가입 신청자들의 ID를 가져옵니다.
		let getGuildJoinRequesterIds = self.getGuildJoinRequesterIds = (guildId, callback) => {
			//REQUIRED: guildId
			//REQUIRED: callback
			
			sendToNode('getGuildJoinRequesterIds', guildId, callback);
		};
		
		// 길드원들의 ID들을 가져옵니다.
		let getGuildMemberIds = self.getGuildMemberIds = (guildId, callback) => {
			//REQUIRED: guildId
			//REQUIRED: callback
			
			sendToNode('getGuildMemberIds', guildId, callback);
		};
		
		// 길드 가입 신청을 거절합니다.
		let denyGuildJoinRequest = self.denyGuildJoinRequest = (requesterId, callback) => {
			//REQUIRED: requesterId
			//REQUIRED: callback
			
			DPlayInventory.getAccountId((accountId) => {
				
				getAccountGuildId(accountId, (guildId) => {
					
					let data = {
						target : guildId,
						accountId : requesterId
					};
					
					DPlayInventory.signData(data, (hash) => {
						
						sendToNode('denyGuildJoinRequest', {
							target : guildId,
							accountId : requesterId,
							hash : hash
						});
						
						callback();
					});
				});
			});
		};
		
		// 길드 가입 신청을 수락합니다.
		let acceptGuildJoinRequest = self.acceptGuildJoinRequest = (requesterId, callback) => {
			//REQUIRED: requesterId
			//REQUIRED: callback
			
			DPlayInventory.getAccountId((accountId) => {
				
				getAccountGuildId(accountId, (guildId) => {
					
					let data = {
						target : guildId,
						createTime : new Date()
					};
					
					DPlayInventory.signData(data, (hash) => {
						
						sendToNode('acceptGuildJoinRequest', {
							target : guildId,
							id : requesterId,
							data : data,
							hash : hash
						});
						
						callback();
					});
				});
			});
		};
		
		// 길드에서 탈퇴합니다.
		let leaveGuild = self.leaveGuild = (callback) => {
			//REQUIRED: callback
			
			DPlayInventory.getAccountId((accountId) => {
				
				getAccountGuildId(accountId, (guildId) => {
					
					DPlayInventory.signText(accountId, (hash) => {
						
						sendToNode('leaveGuild', {
							target : guildId,
							id : accountId,
							hash : hash
						});
						
						callback();
					});
				});
			});
		};
		
		// 길드에서 내쫒습니다.
		let banGuildMember = self.banGuildMember = (accountId, callback) => {
			//REQUIRED: accountId
			//REQUIRED: callback
			
			DPlayInventory.getAccountId((signedAccountId) => {
				
				getAccountGuildId(signedAccountId, (guildId) => {
					
					DPlayInventory.signText(accountId, (hash) => {
						
						sendToNode('leaveGuild', {
							target : guildId,
							id : accountId,
							hash : hash
						});
						
						callback();
					});
				});
			});
		};
		
		let isAccountSigned = false;
		
		let checkAccountIsSigned = self.checkAccountIsSigned = () => {
			return isAccountSigned;
		};
		
		let login = self.login = (callback) => {
			//OPTIONAL: callback
			
			DPlayInventory.getAccountId((accountId) => {
				
				sendToNode('generateLoginToken', undefined, (loginToken) => {
					
					DPlayInventory.signText(loginToken, (hash) => {
						
						sendToNode('login', {
							hash : hash,
							accountId : accountId
						}, (isSucceed) => {
							
							if (isSucceed === true) {
								isAccountSigned = true;
								
								if (callback !== undefined) {
									callback();
								}
							}
						});
					});
				});
			});
		};
		
		// 대상에 참여합니다.
		let joinTarget = self.joinTarget = (target) => {
			//REQUIRED: target
			
			sendToNode('joinTarget', networkName + '/' + target);
		};
		
		// 대상에서 나옵니다.
		let exitTarget = self.exitTarget = (target) => {
			//REQUIRED: target
			
			sendToNode('exitTarget', networkName + '/' + target);
		};
		
		let getChatMessages = self.getChatMessages = (target, callback) => {
			//REQUIRED: target
			//REQUIRED: callback
			
			sendToNode('getChatMessages', networkName + '/' + target, callback);
		};
		
		let sendChatMessage = self.sendChatMessage = (params) => {
			//REQUIRED: params
			//REQUIRED: params.target
			//REQUIRED: params.message
			
			let target = params.target;
			let message = params.message;
			
			sendToNode('sendChatMessage', {
				target : networkName + '/' + target,
				message : message
			});
		};
		
		let onNewChatMessageHandlers = {};
		
		let onNewChatMessage = self.onNewChatMessage = (target, handler) => {
			//REQUIRED: target
			//REQUIRED: handler
			
			onFromNode('newChatMessage', onNewChatMessageHandlers[networkName + '/' + target] = (data) => {
				if (data.target === networkName + '/' + target) {
					handler(data);
				}
			});
		};
		
		let offNewChatMessage = self.offNewChatMessage = (target) => {
			//REQUIRED: target
			
			let handler = onNewChatMessageHandlers[networkName + '/' + target];
			
			if (handler !== undefined) {
				offFromNode('newChatMessage', handler);
				
				delete onNewChatMessageHandlers[networkName + '/' + target];
			}
		};
		
		let getPendingTransactions = self.getPendingTransactions = (target, callback) => {
			//REQUIRED: target
			//REQUIRED: callback
			
			sendToNode('getPendingTransactions', networkName + '/' + target, callback);
		};
		
		let sendPendingTransaction = self.sendPendingTransaction = (params) => {
			//REQUIRED: params
			//REQUIRED: params.target
			//REQUIRED: params.transactionHash
			//REQUIRED: params.message
			
			let target = params.target;
			let transactionHash = params.transactionHash;
			let message = params.message;
			
			sendToNode('sendPendingTransaction', {
				target : networkName + '/' + target,
				network : networkName,
				transactionHash : transactionHash,
				message : message
			});
		};
		
		let onNewPendingTransactionHandlers = {};
		
		let onNewPendingTransaction = self.onNewPendingTransaction = (target, handler) => {
			//REQUIRED: target
			//REQUIRED: handler
			
			onFromNode('newPendingTransaction', onNewPendingTransactionHandlers[networkName + '/' + target] = (data) => {
				if (data.target === networkName + '/' + target) {
					handler(data);
				}
			});
		};
		
		let offNewPendingTransaction = self.offNewPendingTransaction = (target) => {
			//REQUIRED: target
			
			let handler = onNewPendingTransactionHandlers[networkName + '/' + target];
			
			if (handler !== undefined) {
				offFromNode('newPendingTransaction', handler);
				
				delete onNewPendingTransactionHandlers[networkName + '/' + target];
			}
		};
		
		let checkIsPolyfill = self.checkIsPolyfill = () => {
			return true;
		};
		
		return self;
	})();
}