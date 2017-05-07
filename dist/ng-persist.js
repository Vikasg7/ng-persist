'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (angular, window) {

    'use strict';

    angular.module('ng-persist', []);

    var $persist = function $persist($q, $localStorage) {

        var isBrowser = false;
        var isIos = false;
        var isAndroid = false;

        if (!window.cordova && !window.device && typeof Keychain === 'undefined') {
            isBrowser = true;
        } else {
            isAndroid = window.device.platform === 'Android';
            isIos = window.device.platform === 'iOS';
        }

        var LocalStorageAdapter = function () {
            function LocalStorageAdapter() {
                _classCallCheck(this, LocalStorageAdapter);
            }

            _createClass(LocalStorageAdapter, [{
                key: 'read',
                value: function read(namespace, key) {
                    var deferred = $q.defer();
                    var val = $localStorage[namespace + '_' + key];
                    deferred.resolve(val);
                    return deferred.promise;
                }
            }, {
                key: 'write',
                value: function write(namespace, key, val) {
                    var deferred = $q.defer();
                    $localStorage[namespace + '_' + key] = val;
                    deferred.resolve();
                    return deferred.promise;
                }
            }, {
                key: 'remove',
                value: function remove(namespace, key) {
                    var deferred = $q.defer();
                    delete $localStorage[namespace + '_' + key];
                    deferred.resolve();
                    return deferred.promise;
                }
            }]);

            return LocalStorageAdapter;
        }();

        var IosKeychainAdapter = function () {
            function IosKeychainAdapter() {
                _classCallCheck(this, IosKeychainAdapter);
            }

            _createClass(IosKeychainAdapter, [{
                key: 'read',
                value: function read(namespace, key) {
                    var deferred = $q.defer();
                    Keychain.get(function (val) {
                        if (val !== "") {
                            val = JSON.parse(val);
                        } else {
                            val = null;
                        }
                        deferred.resolve(val);
                    }, function (err) {
                        deferred.reject(err);
                    }, key, '');
                    return deferred.promise;
                }
            }, {
                key: 'write',
                value: function write(namespace, key, val) {
                    var deferred = $q.defer();
                    val = JSON.stringify(val);
                    Keychain.set(function () {
                        deferred.resolve();
                    }, function (err) {
                        deferred.reject(err);
                    }, key, val, false);
                    return deferred.promise;
                }
            }, {
                key: 'remove',
                value: function remove(namespace, key) {
                    var deferred = $q.defer();
                    Keychain.remove(function () {
                        deferred.resolve();
                    }, function (err) {
                        deferred.reject(err);
                    }, key);
                    return deferred.promise;
                }
            }]);

            return IosKeychainAdapter;
        }();

        var AndroidExternalStorageAdapter = function () {
            function AndroidExternalStorageAdapter() {
                _classCallCheck(this, AndroidExternalStorageAdapter);
            }

            _createClass(AndroidExternalStorageAdapter, [{
                key: 'read',
                value: function read(namespace, key) {
                    var deferred = $q.defer();
                    var filename = namespace + '_' + key;
                    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory + filename, function (fileEntry) {
                        fileEntry.file(function (file) {
                            var reader = new FileReader();
                            reader.onloadend = function (evt) {
                                var res = evt.target.result;
                                if (res !== "") {
                                    res = JSON.parse(res);
                                } else {
                                    res = null;
                                }
                                deferred.resolve(res);
                            };
                            reader.readAsText(file);
                        });
                    }, function (err) {
                        deferred.reject(err);
                    });
                    return deferred.promise;
                }
            }, {
                key: 'write',
                value: function write(namespace, key, val) {
                    var deferred = $q.defer();
                    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (dir) {
                        var filename = namespace + '_' + key;
                        dir.getFile(filename, { create: true }, function (file) {
                            if (!file) {
                                deferred.reject();
                            }
                            file.createWriter(function (fileWriter) {
                                // fileWriter.seek(fileWriter.length);
                                var blob = new Blob([JSON.stringify(val)], { type: 'text/plain' });
                                fileWriter.write(blob);
                                deferred.resolve();
                            }, function (err) {
                                deferred.reject(err);
                            });
                        });
                    });
                    return deferred.promise;
                }
            }, {
                key: 'remove',
                value: function remove(namespace, key) {
                    var deferred = $q.defer();
                    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (dir) {
                        var filename = namespace + '_' + key;
                        dir.getFile(filename, { create: true }, function (file) {
                            if (!file) {
                                deferred.reject();
                            }
                            file.createWriter(function (fileWriter) {
                                // fileWriter.seek(fileWriter.length);
                                var blob = new Blob([''], { type: 'text/plain' });
                                fileWriter.write(blob);
                                deferred.resolve();
                            }, function (err) {
                                deferred.reject(err);
                            });
                        });
                    });
                    return deferred.promise;
                }
            }]);

            return AndroidExternalStorageAdapter;
        }();

        var getAdapter = function getAdapter() {
            if (isBrowser) {
                return new LocalStorageAdapter();
            } else if (isIos) {
                return new IosKeychainAdapter();
            } else if (isAndroid) {
                return new AndroidExternalStorageAdapter();
            }
        };

        // calling getAdapter just ones and keeping the reference for next calls.
        // it will avoid creation of new object each time getAdapter is called.
        var adapter = getAdapter();
        return {
            set: function set() {
                var namespace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
                var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var val = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

                var deferred = $q.defer();
                adapter.write(namespace, key, val).then(deferred.resolve)
                // isBrowser check here was meaningless in previous api.
                .catch(deferred.reject);
                return deferred.promise;
            },
            get: function get() {
                var namespace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
                var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var fallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

                var deferred = $q.defer();
                adapter.read(namespace, key).then(function (val) {
                    if (val) {
                        deferred.resolve(val);
                    } else {
                        deferred.resolve(fallback);
                    }
                }).catch(function () {
                    deferred.reject(fallback);
                });
                return deferred.promise;
            },
            remove: function remove(namespace, key) {
                return adapter.remove(namespace, key);
            }
        };
    };
    $persist.$inject = ['$q', '$localStorage'];
    angular.module('ng-persist').factory('$persist', $persist);
})(angular, window);