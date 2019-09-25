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
		let self = {};
		
		const HARD_CODED_URLS = [
			'218.38.19.34:8923',
			'175.207.29.151:8923'
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
					port : INTEGER(splits[1])
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
				port : INTEGER(splits[1])
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
		
		// 길드 목록을 가져옵니다.
		let getGuildList = self.getGuildList = (callback) => {
			//REQUIRED: callback
			
			sendToNode('getGuildList', undefined, callback);
		};
		
		// 특정 유저가 가입한 길드 정보를 가져옵니다.
		let getAccountGuild = self.getAccountGuild = (accountId, callback) => {
			//REQUIRED: accountId
			//REQUIRED: callback
			
			sendToNode('getAccountGuild', accountId, callback);
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
		
		// 길드 가입 신청을 거절합니다.
		let denyGuildJoinRequest = self.denyGuildJoinRequest = (requesterId, callback) => {
			//REQUIRED: requesterId
			//REQUIRED: callback
			
			DPlayInventory.getAccountId((accountId) => {
				
				getAccountGuild(accountId, (guildData) => {
					
					let target = guildData.id;
					
					let data = {
						target : target,
						accountId : requesterId
					};
					
					DPlayInventory.signData(data, (hash) => {
						
						sendToNode('denyGuildJoinRequest', {
							target : target,
							accountId : requesterId,
							hash : hash
						});
						
						callback();
					});
				});
			});
		};
		
		// 길드 가입 신청을 수락합니다.
		let acceptGuildJoinRequest = self.acceptGuildJoinRequest = (requesterId, callbackOrHandlers) => {
			//REQUIRED: requesterId
			//REQUIRED: callbackOrHandlers
			//OPTIONAL: callbackOrHandlers.notValid
			//OPTIONAL: callbackOrHandlers.notVerified
			//OPTIONAL: callbackOrHandlers.notEnoughD
			//REQUIRED: callbackOrHandlers.success
			
			DPlayInventory.getAccountId((accountId) => {
				
				getAccountGuild(accountId, (guildData) => {
					
					guildData.memberIds.push(requesterId);
					guildData.lastUpdateTime = getNodeTime(new Date());
					
					DPlayInventory.signData(guildData, (hash) => {
						
						sendToNode('updateGuild', {
							data : guildData,
							hash : hash
						}, seperateHandler(callbackOrHandlers));
					});
				});
			});
		};
		
		let isAccountSigned = false;
		
		let checkAccountIsSigned = self.checkAccountIsSigned = () => {
			return isAccountSigned;
		};
		
		let login = self.login = (callback) => {
			//REQUIRED: callback
			
			DPlayInventory.getAccountId((accountId) => {
				
				sendToNode('generateLoginToken', undefined, (loginToken) => {
					
					DPlayInventory.signText(loginToken, (hash) => {
						
						sendToNode('login', {
							hash : hash,
							accountId : accountId
						}, (isSucceed) => {
							
							if (isSucceed === true) {
								isAccountSigned = true;
								
								callback();
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
			}
		};
		
		return self;
	})();
}