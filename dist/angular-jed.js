(function() {
  'use strict';
  var cache, commonDatas, defaultLang, extend, gettext, i18n, lang, ngettext, pageDatas, translationsPath;
  defaultLang = 'en_US';
  lang = defaultLang;
  i18n = false;
  translationsPath = false;
  pageDatas = false;
  commonDatas = {};
  cache = {};
  extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };
  gettext = function(key) {
    if (i18n) {
      return i18n.gettext(key);
    } else {
      return key;
    }
  };
  ngettext = function(singular_key, plural_key, value) {
    if (i18n) {
      return i18n.ngettext(singular_key, plural_key, value);
    } else {
      if (value === 1) {
        return singular_key;
      } else {
        return plural_key;
      }
    }
  };
  angular.module('jed', []);
  angular.module('jed').factory('i18n', [
    '$http', '$rootScope', '$q', function($http, $rootScope, $q) {
      var get, jed, readyDeferred, setI18N;
      readyDeferred = $q.defer();
      get = function(file) {
        var deferred, varName;
        deferred = $q.defer();
        varName = file.replace('.json', '');
        if (window.translations && window.translations[varName]) {
          deferred.resolve(JSON.parse(window.translations[varName]));
        } else if (file in cache) {
          deferred.resolve(cache[file]);
        } else {
          $http.get("" + translationsPath + "/" + file).success(function(data) {
            cache[file] = data;
            return deferred.resolve(data);
          }).error(function() {
            return deferred.reject();
          });
        }
        return deferred.promise;
      };
      setI18N = function(data) {
        if (data == null) {
          data = false;
        }
        i18n = data ? new Jed(data) : void 0;
        $rootScope._ = function(key) {
          return jed._(key);
        };
        return $rootScope._n = function(singular_key, plural_key, value, placeholders, none) {
          return jed._n(singular_key, plural_key, value, placeholders, none);
        };
      };
      return jed = {
        setTranslationPath: function(path) {
          translationsPath = path;
          return jed;
        },
        setLang: function(value) {
          lang = value;
          return jed;
        },
        setDefaultLang: function(lang) {
          defaultLang = lang;
          return jed;
        },
        loadCommon: function(common) {
          var deferred;
          deferred = $q.defer();
          get("" + common + "-" + lang + ".json").then(function(data) {
            commonDatas = extend(commonDatas, data.locale_data.messages);
            if (pageDatas) {
              pageDatas.locale_data.messages = extend(pageDatas.locale_data.messages, commonDatas);
              setI18N(pageDatas);
            } else {
              setI18N(data);
            }
            readyDeferred.resolve();
            return deferred.resolve();
          }, function() {
            readyDeferred.resolve();
            return deferred.resolve();
          });
          return deferred.promise;
        },
        loadPage: function(page) {
          var deferred;
          deferred = $q.defer();
          get("" + page + "-" + lang + ".json").then(function(data) {
            data.locale_data.messages = extend(data.locale_data.messages, commonDatas);
            pageDatas = data;
            setI18N(data);
            readyDeferred.resolve();
            return deferred.resolve();
          }, function() {
            if (lang === defaultLang) {
              setI18N();
            } else {
              jed.loadPage(page);
            }
            readyDeferred.resolve();
            return deferred.resolve();
          });
          return deferred.promise;
        },
        _: function(key, placeholders) {
          var result;
          if (placeholders == null) {
            placeholders = {};
          }
          result = gettext(key);
          return _.template(result, placeholders, {
            interpolate: /%([\s\S]+?)%/g
          });
        },
        _n: function(singular, plural, count, placeholders, none) {
          var result;
          if (placeholders == null) {
            placeholders = {};
          }
          placeholders.count = count;
          if (count.toString() === '0' && none) {
            result = gettext(none);
          } else {
            result = ngettext(singular, plural, count);
          }
          return _.template(result, placeholders, {
            interpolate: /%([\s\S]+?)%/g
          });
        },
        ready: function() {
          return readyDeferred.promise;
        }
      };
    }
  ]);
  angular.module('jed').directive('trans', [
    'i18n', function(i18n) {
      return {
        restrict: 'E',
        replace: true,
        scope: {
          singular: '@',
          plural: '@',
          none: '@',
          count: '=',
          placeholders: '='
        },
        template: '<span>{{ result }}</span>',
        controller: function($scope, $element) {
          var key, name, ready, render, watchObjects, _count, _placeholders, _ref;
          ready = false;
          _placeholders = {};
          _count = 0;
          i18n.ready().then(function() {
            ready = true;
            return render(_count, _placeholders);
          });
          render = function(count, placeholders) {
            _count = count;
            _placeholders = placeholders;
            if (!ready) {
              return;
            }
            if (!Object.keys($scope.placeholders).length) {
              return;
            }
            return $scope.result = i18n._n($scope.singular, $scope.plural, $scope.count, $scope.placeholders, $scope.nonenone);
          };
          watchObjects = ['count'];
          _ref = Object.keys($scope.placeholders);
          for (key in _ref) {
            name = _ref[key];
            watchObjects.push("placeholders." + name);
          }
          return $scope.$watchGroup(watchObjects, function() {
            if (typeof parseInt($scope.count) !== 'number' || $scope.count === '') {
              return;
            }
            return render($scope.count, $scope.placeholders);
          });
        }
      };
    }
  ]);
  return angular.module('jed').filter('trans', function(i18n) {
    var transFilter;
    transFilter = function(text, options) {
      if (options == null) {
        options = {};
      }
      if (options.plural) {
        return i18n._n(text, options.plural, options.count, options.placeholders, options.none);
      } else {
        if (options.placeholders == null) {
          options.placeholders = {};
        }
        return i18n._(text, options.placeholders);
      }
    };
    transFilter.$stateful = true;
    return transFilter;
  });
})();

//# sourceMappingURL=data:application/json;base64,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Q0FBQyxNQUFSLENBQWUsS0FBZixDQUFxQixDQUFDLE1BQXRCLENBQTZCLE9BQTdCLEVBQXNDLFNBQUMsSUFBRCxHQUFBO0FBQ3BDLFFBQUEsV0FBQTtBQUFBLElBQUEsV0FBQSxHQUFjLFNBQUMsSUFBRCxFQUFPLE9BQVAsR0FBQTs7UUFBTyxVQUFVO09BQzdCO0FBQUEsTUFBQSxJQUFHLE9BQU8sQ0FBQyxNQUFYO2VBQ0UsSUFBSSxDQUFDLEVBQUwsQ0FBUSxJQUFSLEVBQWMsT0FBTyxDQUFDLE1BQXRCLEVBQThCLE9BQU8sQ0FBQyxLQUF0QyxFQUE2QyxPQUFPLENBQUMsWUFBckQsRUFBbUUsT0FBTyxDQUFDLElBQTNFLEVBREY7T0FBQSxNQUFBOztVQUdFLE9BQU8sQ0FBQyxlQUFnQjtTQUF4QjtlQUNBLElBQUksQ0FBQyxDQUFMLENBQU8sSUFBUCxFQUFhLE9BQU8sQ0FBQyxZQUFyQixFQUpGO09BRFk7SUFBQSxDQUFkLENBQUE7QUFBQSxJQU9BLFdBQVcsQ0FBQyxTQUFaLEdBQXdCLElBUHhCLENBQUE7V0FTQSxZQVZvQztFQUFBLENBQXRDLEVBakxEO0FBQUEsQ0FBRCxDQUFBLENBQUEsQ0FBQSxDQUFBIiwiZmlsZSI6ImFuZ3VsYXItamVkLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiKC0+XG4gICd1c2Ugc3RyaWN0J1xuXG4gIGRlZmF1bHRMYW5nID0gJ2VuX1VTJ1xuICBsYW5nID0gZGVmYXVsdExhbmdcbiAgaTE4biA9IGZhbHNlXG4gIHRyYW5zbGF0aW9uc1BhdGggPSBmYWxzZVxuICBwYWdlRGF0YXMgPSBmYWxzZVxuICBjb21tb25EYXRhcyA9IHt9XG4gIGNhY2hlID0ge31cblxuICBleHRlbmQgPSAob2JqZWN0LCBwcm9wZXJ0aWVzKSAtPlxuICAgIGZvciBrZXksIHZhbCBvZiBwcm9wZXJ0aWVzXG4gICAgICBvYmplY3Rba2V5XSA9IHZhbFxuICAgIG9iamVjdFxuXG4gIGdldHRleHQgPSAoa2V5KSAtPlxuICAgIGlmIGkxOG4gdGhlbiBpMThuLmdldHRleHQoa2V5KSBlbHNlIGtleVxuXG4gIG5nZXR0ZXh0ID0gKHNpbmd1bGFyX2tleSwgcGx1cmFsX2tleSwgdmFsdWUpIC0+XG4gICAgaWYgaTE4blxuICAgICAgaTE4bi5uZ2V0dGV4dCBzaW5ndWxhcl9rZXksIHBsdXJhbF9rZXksIHZhbHVlXG4gICAgZWxzZVxuICAgICAgaWYgdmFsdWUgPT0gMSB0aGVuIHNpbmd1bGFyX2tleSBlbHNlIHBsdXJhbF9rZXlcblxuICBhbmd1bGFyLm1vZHVsZSAnamVkJywgW11cblxuICBhbmd1bGFyLm1vZHVsZSgnamVkJykuZmFjdG9yeSAnaTE4bicsIFtcbiAgICAnJGh0dHAnXG4gICAgJyRyb290U2NvcGUnXG4gICAgJyRxJ1xuICAgICgkaHR0cCwgJHJvb3RTY29wZSwgJHEpIC0+XG4gICAgICByZWFkeURlZmVycmVkID0gJHEuZGVmZXIoKVxuXG4gICAgICAjIEdldCBhIHRyYW5zbGF0aW9uIGZpbGUgZnJvbSBjYWNoZSBvciBhamF4XG4gICAgICBnZXQgPSAoZmlsZSkgLT5cbiAgICAgICAgZGVmZXJyZWQgPSAkcS5kZWZlcigpXG4gICAgICAgIHZhck5hbWUgPSBmaWxlLnJlcGxhY2UoJy5qc29uJywgJycpXG4gICAgICAgIGlmIHdpbmRvdy50cmFuc2xhdGlvbnMgYW5kIHdpbmRvdy50cmFuc2xhdGlvbnNbdmFyTmFtZV1cbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKEpTT04ucGFyc2Ugd2luZG93LnRyYW5zbGF0aW9uc1t2YXJOYW1lXSlcbiAgICAgICAgZWxzZSBpZiBmaWxlIG9mIGNhY2hlXG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShjYWNoZVtmaWxlXSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICRodHRwLmdldChcIiN7dHJhbnNsYXRpb25zUGF0aH0vI3tmaWxlfVwiKVxuICAgICAgICAgICAgLnN1Y2Nlc3MgKGRhdGEpIC0+XG4gICAgICAgICAgICAgIGNhY2hlW2ZpbGVdID0gZGF0YVxuICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRhdGEpXG4gICAgICAgICAgICAuZXJyb3IgLT5cbiAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KClcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2VcblxuICAgICAgIyBJbml0aWFsaXplIEplZFxuICAgICAgc2V0STE4TiA9IChkYXRhID0gZmFsc2UpIC0+XG4gICAgICAgIGkxOG4gPSBpZiBkYXRhIHRoZW4gbmV3IEplZChkYXRhKVxuXG4gICAgICAgICRyb290U2NvcGUuXyA9IChrZXkpIC0+XG4gICAgICAgICAgamVkLl8oa2V5KVxuXG4gICAgICAgICRyb290U2NvcGUuX24gPSAoc2luZ3VsYXJfa2V5LCBwbHVyYWxfa2V5LCB2YWx1ZSwgcGxhY2Vob2xkZXJzLCBub25lKSAtPlxuICAgICAgICAgIGplZC5fbihzaW5ndWxhcl9rZXksIHBsdXJhbF9rZXksIHZhbHVlLCBwbGFjZWhvbGRlcnMsIG5vbmUpXG5cbiAgICAgICMgUHVibGljIEFQSVxuICAgICAgamVkID1cbiAgICAgICAgc2V0VHJhbnNsYXRpb25QYXRoOiAocGF0aCkgLT5cbiAgICAgICAgICB0cmFuc2xhdGlvbnNQYXRoID0gcGF0aFxuICAgICAgICAgIGplZFxuXG4gICAgICAgIHNldExhbmc6ICh2YWx1ZSkgLT5cbiAgICAgICAgICBsYW5nID0gdmFsdWVcbiAgICAgICAgICBqZWRcblxuICAgICAgICBzZXREZWZhdWx0TGFuZzogKGxhbmcpIC0+XG4gICAgICAgICAgZGVmYXVsdExhbmcgPSBsYW5nXG4gICAgICAgICAgamVkXG5cbiAgICAgICAgIyBMb2FkIGNvbW1vbiB0cmFuc2xhdGlvbnNcbiAgICAgICAgbG9hZENvbW1vbjogKGNvbW1vbikgLT5cbiAgICAgICAgICBkZWZlcnJlZCA9ICRxLmRlZmVyKClcbiAgICAgICAgICBnZXQoXCIje2NvbW1vbn0tI3tsYW5nfS5qc29uXCIpLnRoZW4oKGRhdGEpIC0+XG4gICAgICAgICAgICAjIG5vdCBzdXJlIHRoaXMgaXMgbmVlZGVkIHRob1xuICAgICAgICAgICAgY29tbW9uRGF0YXMgPSBleHRlbmQgY29tbW9uRGF0YXMsIGRhdGEubG9jYWxlX2RhdGEubWVzc2FnZXNcbiAgICAgICAgICAgIGlmIHBhZ2VEYXRhc1xuICAgICAgICAgICAgICBwYWdlRGF0YXMubG9jYWxlX2RhdGEubWVzc2FnZXMgPSBleHRlbmQgcGFnZURhdGFzLmxvY2FsZV9kYXRhLm1lc3NhZ2VzLCBjb21tb25EYXRhc1xuICAgICAgICAgICAgICBzZXRJMThOIHBhZ2VEYXRhc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBzZXRJMThOIGRhdGFcbiAgICAgICAgICAgIHJlYWR5RGVmZXJyZWQucmVzb2x2ZSgpXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKClcbiAgICAgICAgICAsIC0+XG4gICAgICAgICAgICByZWFkeURlZmVycmVkLnJlc29sdmUoKVxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpXG4gICAgICAgICAgKVxuICAgICAgICAgIGRlZmVycmVkLnByb21pc2VcblxuICAgICAgICAjIExvYWQgcGFnZSB0cmFuc2xhdGlvblxuICAgICAgICBsb2FkUGFnZTogKHBhZ2UpIC0+XG4gICAgICAgICAgZGVmZXJyZWQgPSAkcS5kZWZlcigpXG4gICAgICAgICAgZ2V0KFwiI3twYWdlfS0je2xhbmd9Lmpzb25cIikudGhlbigoZGF0YSkgLT5cbiAgICAgICAgICAgIGRhdGEubG9jYWxlX2RhdGEubWVzc2FnZXMgPSBleHRlbmQgZGF0YS5sb2NhbGVfZGF0YS5tZXNzYWdlcywgY29tbW9uRGF0YXNcbiAgICAgICAgICAgIHBhZ2VEYXRhcyA9IGRhdGFcbiAgICAgICAgICAgIHNldEkxOE4gZGF0YVxuICAgICAgICAgICAgcmVhZHlEZWZlcnJlZC5yZXNvbHZlKClcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKVxuICAgICAgICAgICwgLT5cbiAgICAgICAgICAgIGlmIGxhbmcgPT0gZGVmYXVsdExhbmdcbiAgICAgICAgICAgICAgc2V0STE4TigpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGplZC5sb2FkUGFnZShwYWdlKVxuICAgICAgICAgICAgcmVhZHlEZWZlcnJlZC5yZXNvbHZlKClcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKVxuICAgICAgICAgIClcbiAgICAgICAgICBkZWZlcnJlZC5wcm9taXNlXG5cbiAgICAgICAgXzogKGtleSwgcGxhY2Vob2xkZXJzID0ge30pIC0+XG4gICAgICAgICAgcmVzdWx0ID0gZ2V0dGV4dChrZXkpXG4gICAgICAgICAgXy50ZW1wbGF0ZShyZXN1bHQsIHBsYWNlaG9sZGVycyxcbiAgICAgICAgICAgIGludGVycG9sYXRlOiAvJShbXFxzXFxTXSs/KSUvZ1xuICAgICAgICAgIClcblxuICAgICAgICBfbjogKHNpbmd1bGFyLCBwbHVyYWwsIGNvdW50LCBwbGFjZWhvbGRlcnMgPSB7fSwgbm9uZSkgLT5cbiAgICAgICAgICBwbGFjZWhvbGRlcnMuY291bnQgPSBjb3VudFxuICAgICAgICAgIGlmIGNvdW50LnRvU3RyaW5nKCkgPT0gJzAnIGFuZCBub25lXG4gICAgICAgICAgICByZXN1bHQgPSBnZXR0ZXh0IG5vbmVcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXN1bHQgPSBuZ2V0dGV4dCBzaW5ndWxhciwgcGx1cmFsLCBjb3VudFxuXG4gICAgICAgICAgXy50ZW1wbGF0ZShyZXN1bHQsIHBsYWNlaG9sZGVycyxcbiAgICAgICAgICAgIGludGVycG9sYXRlOiAvJShbXFxzXFxTXSs/KSUvZ1xuICAgICAgICAgIClcblxuICAgICAgICByZWFkeTogLT5cbiAgICAgICAgICByZWFkeURlZmVycmVkLnByb21pc2VcbiAgXVxuXG4gIGFuZ3VsYXIubW9kdWxlKCdqZWQnKS5kaXJlY3RpdmUgJ3RyYW5zJywgW1xuICAgICdpMThuJ1xuICAgIChpMThuKSAtPlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgcmVzdHJpY3Q6ICdFJ1xuICAgICAgICByZXBsYWNlOiB0cnVlXG4gICAgICAgIHNjb3BlOlxuICAgICAgICAgIHNpbmd1bGFyOiAnQCdcbiAgICAgICAgICBwbHVyYWw6ICdAJ1xuICAgICAgICAgIG5vbmU6ICdAJ1xuICAgICAgICAgIGNvdW50OiAnPSdcbiAgICAgICAgICBwbGFjZWhvbGRlcnM6ICc9J1xuICAgICAgICB0ZW1wbGF0ZTogJzxzcGFuPnt7IHJlc3VsdCB9fTwvc3Bhbj4nXG4gICAgICAgIGNvbnRyb2xsZXI6ICgkc2NvcGUsICRlbGVtZW50KSAtPlxuICAgICAgICAgIHJlYWR5ID0gZmFsc2U7XG4gICAgICAgICAgX3BsYWNlaG9sZGVycyA9IHt9XG4gICAgICAgICAgX2NvdW50ID0gMFxuXG4gICAgICAgICAgaTE4bi5yZWFkeSgpLnRoZW4gLT5cbiAgICAgICAgICAgIHJlYWR5ID0gdHJ1ZVxuICAgICAgICAgICAgcmVuZGVyKF9jb3VudCwgX3BsYWNlaG9sZGVycylcblxuICAgICAgICAgIHJlbmRlciA9IChjb3VudCwgcGxhY2Vob2xkZXJzKSAtPlxuICAgICAgICAgICAgX2NvdW50ID0gY291bnRcbiAgICAgICAgICAgIF9wbGFjZWhvbGRlcnMgPSBwbGFjZWhvbGRlcnNcbiAgICAgICAgICAgIHJldHVybiB1bmxlc3MgcmVhZHlcbiAgICAgICAgICAgIHJldHVybiB1bmxlc3MgT2JqZWN0LmtleXMoJHNjb3BlLnBsYWNlaG9sZGVycykubGVuZ3RoXG4gICAgICAgICAgICAkc2NvcGUucmVzdWx0ID0gaTE4bi5fbigkc2NvcGUuc2luZ3VsYXIsICRzY29wZS5wbHVyYWwsICRzY29wZS5jb3VudCwgJHNjb3BlLnBsYWNlaG9sZGVycywgJHNjb3BlLm5vbmVub25lKVxuXG4gICAgICAgICAgd2F0Y2hPYmplY3RzID0gWydjb3VudCddXG5cbiAgICAgICAgICBmb3Iga2V5LCBuYW1lIG9mIE9iamVjdC5rZXlzKCRzY29wZS5wbGFjZWhvbGRlcnMpXG4gICAgICAgICAgICB3YXRjaE9iamVjdHMucHVzaCBcInBsYWNlaG9sZGVycy4je25hbWV9XCJcblxuICAgICAgICAgICRzY29wZS4kd2F0Y2hHcm91cCh3YXRjaE9iamVjdHMsIC0+XG4gICAgICAgICAgICBpZiB0eXBlb2YgcGFyc2VJbnQoJHNjb3BlLmNvdW50KSAhPSAnbnVtYmVyJyBvciAkc2NvcGUuY291bnQgPT0gJydcbiAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIHJlbmRlcigkc2NvcGUuY291bnQsICRzY29wZS5wbGFjZWhvbGRlcnMpXG4gICAgICAgICAgKVxuICAgICAgKVxuICBdXG5cbiAgYW5ndWxhci5tb2R1bGUoJ2plZCcpLmZpbHRlciAndHJhbnMnLCAoaTE4bikgLT5cbiAgICB0cmFuc0ZpbHRlciA9ICh0ZXh0LCBvcHRpb25zID0ge30pIC0+XG4gICAgICBpZiBvcHRpb25zLnBsdXJhbFxuICAgICAgICBpMThuLl9uKHRleHQsIG9wdGlvbnMucGx1cmFsLCBvcHRpb25zLmNvdW50LCBvcHRpb25zLnBsYWNlaG9sZGVycywgb3B0aW9ucy5ub25lKVxuICAgICAgZWxzZVxuICAgICAgICBvcHRpb25zLnBsYWNlaG9sZGVycyA/PSB7fVxuICAgICAgICBpMThuLl8gdGV4dCwgb3B0aW9ucy5wbGFjZWhvbGRlcnNcblxuICAgIHRyYW5zRmlsdGVyLiRzdGF0ZWZ1bCA9IHRydWVcblxuICAgIHRyYW5zRmlsdGVyXG4pKClcbiJdfQ==