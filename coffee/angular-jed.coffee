(->
  'use strict'

  defaultLang = 'en_US'
  lang = defaultLang
  i18n = false
  translationsPath = false
  pageDatas = false
  commonDatas = {}
  cache = {}

  extend = (object, properties) ->
    for key, val of properties
      object[key] = val
    object

  gettext = (key) ->
    if i18n then i18n.gettext(key) else key

  ngettext = (singular_key, plural_key, value) ->
    if i18n
      i18n.ngettext singular_key, plural_key, value
    else
      if value == 1 then singular_key else plural_key

  angular.module 'jed', []

  angular.module('jed').service 'i18n', [
    '$http'
    '$rootScope'
    '$q'
    ($http, $rootScope, $q) ->
      readyDeferred = $q.defer()

      # Get a translation file from cache or ajax
      get = (file) ->
        deferred = $q.defer()
        varName = file.replace('.json', '')
        if window.translations and window.translations[varName]
          deferred.resolve(JSON.parse window.translations[varName])
        else if file of cache
          deferred.resolve(cache[file])
        else
          $http.get("#{translationsPath}/#{file}")
            .success (data) ->
              cache[file] = data
              deferred.resolve(data)
            .error ->
              deferred.reject()
        return deferred.promise

      # Initialize Jed
      setI18N = (data = false) ->
        i18n = if data then new Jed(data)

        $rootScope._ = (key) ->
          jed._(key)

        $rootScope._n = (singular_key, plural_key, value, placeholders, none) ->
          jed._n(singular_key, plural_key, value, placeholders, none)

      # Public API
      jed =
        setTranslationPath: (path) ->
          translationsPath = path
          jed

        setLang: (value) ->
          lang = value
          jed

        setDefaultLang: (lang) ->
          defaultLang = lang
          jed

        # Load common translations
        loadCommon: (common) ->
          deferred = $q.defer()
          get("#{common}-#{lang}.json").then((data) ->
            # not sure this is needed tho
            commonDatas = extend commonDatas, data.locale_data.messages
            if pageDatas
              pageDatas.locale_data.messages = extend pageDatas.locale_data.messages, commonDatas
              setI18N pageDatas
            else
              setI18N data
            readyDeferred.resolve()
            deferred.resolve()
          , ->
            readyDeferred.resolve()
            deferred.resolve()
          )
          deferred.promise

        # Load page translation
        loadPage: (page) ->
          deferred = $q.defer()
          get("#{page}-#{lang}.json").then((data) ->
            data.locale_data.messages = extend data.locale_data.messages, commonDatas
            pageDatas = data
            setI18N data
            readyDeferred.resolve()
            deferred.resolve()
          , ->
            if lang == defaultLang
              setI18N()
            else
              jed.loadPage(page)
            readyDeferred.resolve()
            deferred.resolve()
          )
          deferred.promise

        _: (key, placeholders = {}) ->
          result = gettext(key)
          _.template(result, placeholders,
            interpolate: /%([\s\S]+?)%/g
          )

        _n: (singular, plural, count, placeholders = {}, none) ->
          placeholders.count = count
          if count.toString() == '0' and none
            result = gettext none
          else
            result = ngettext singular, plural, count

          _.template(result, placeholders,
            interpolate: /%([\s\S]+?)%/g
          )

        ready: ->
          readyDeferred.promise
  ]

  angular.module('jed').directive 'trans', [
    'i18n'
    '$interpolate'
    '$locale'
    (i18n, $interpolate, $locale) ->
      BRACE = /{}/g
      WHITESPACE = new RegExp(' ', 'g')
      return (
        restrict: 'AE'
        replace: true
        link: (scope, element, attr) ->
          countExp = attr.count
          whenExp = attr.$attr.when && element.attr attr.$attr.when
          whens = scope.$eval whenExp
          lastCount = null
          ready = false
          _count = false
          watchExps = []

          i18n.ready().then ->
            render(_count)

          for key, expression of whens
            exprFn = $interpolate(expression)
            for exp in exprFn.expressions
              exp = exp.split('|')[0].replace(WHITESPACE, '')
              watchExps.push exp unless exp in watchExps

          render = (count) ->
            result = false
            if count == 0 and angular.isDefined whens[0]
              result = whens[0]

            if result
              result = i18n._ result
            else
              singular = whens['one'] ?= whens['singular']
              result = i18n._n singular, whens['plural'], count

            result = $interpolate(result)
            updateElementText result(scope)

          scope.$watch countExp, (newVal) ->
            count = parseInt newVal
            nbrCount = count

            countIsNaN = isNaN count

            if !countIsNaN && !(count in whens)
              count = $locale.pluralCat count

            if (count != lastCount) && !(countIsNaN && isNaN(lastCount))
              _count = nbrCount
              render(nbrCount)
              lastCount = nbrCount

          scope.$watchGroup watchExps, ->
            render(lastCount)

          updateElementText = (text) ->
            element.text text if text
      )
  ]

  angular.module('jed').filter 'trans', (i18n) ->
    transFilter = (text, options = {}) ->
      if options.plural
        i18n._n(text, options.plural, options.count, options.placeholders, options.none)
      else
        options.placeholders ?= {}
        i18n._ text, options.placeholders

    transFilter.$stateful = true

    transFilter
)()
