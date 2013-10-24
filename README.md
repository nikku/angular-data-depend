# angular-data-depend

[![Build Status](https://travis-ci.org/Nikku/angular-data-depend.png?branch=master)](https://travis-ci.org/Nikku/angular-data-depend)

A toolkit for implementing complex, data heavy [AngularJS](http://angularjs.org/) applications.


## Features

__dataDepend__ allows you handle complex data dependencies via _data providers_ and _data observers_. 

*   It allows you to make data dependencies in explicit
*   It takes care of resolving only the required data in the correct order
*   It updates dependent data upon changes
*   It gives you feedback on the load state of the data


## Overview

Use __dataDepend__ to structure your application into _providers_ and _observers_ and let the library do all the rest.

```javascript
function MyController($scope, Article, Comment, Authentication, dataDepend) {

  var $data = dataDepend.create($scope);

  // providers ///////////

  $data.provide('articleId', 22);
  $data.provide('currentUser', Authentication.currentUser());

  $data.provide('article', ['articleId', function(id) {
    return Article.get({ id: id }).$promise;
  }]);

  $data.provide('recommendations', ['article', 'currentUser', function(article, comments, currentUser) {
    return Article.queryRecommended({ article: article, user: currentUser }).$promise;
  }]);

  // consumers ///////////

  function updateView(article, recommendations) {
    // update current scope
  }

  // $scope.view keeps track of current loading state 
  // and provides access to loaded variable
  $scope.view = $data.observe(['article', 'recommendations', updateView]);
}
```


## Resources

-   [Website](http://nikku.github.io/angular-data-depend/)
-   [Issue tracker](https://github.com/Nikku/angular-data-depend/issues)


## Usage

Create a new data container:

```javascript
var $data = dataDepend.create($scope);
```

#### Providers

Providers compute, fetch or statically supply the application with a named data items. 
Register a data provider via `#provide(name, definition | value)`. The simples provider is the static one, producing a primitive or object value:

```javascript
$data.provide('articleId', 22);
```

The values produced by static providers may be updated via `$data.set(name, value)`;

A dynamic provider is a function that returns either the value or a [promise](http://docs.angularjs.org/api/ng.$q#description_the-promise-api):

```
$data.provide('articleFromBackend', function() {
  return $http.get('/the-one-and-only-article').then(function(response) {
    return response.data
  });  
});
```

Dynamic providers may declare dependencies on other data items (in a [$injector](http://docs.angularjs.org/api/AUTO.$injector) compatible format):

```javascript
$data.provide('article', ['articleId', function(id) {
  return $http.get('/articles/' + id).then(function(response) {
    return response.data
  });
}]);
```

#### Observers

Observers get notified whenever a set of data items change.
They track the load status of these items, trigger their evaluation and should be used as the end points to bind data items to the view scope.

Register an observer via `#observe(definition)`:

```javascript
var handle = $data.observe(['article', 'articleDetails', function(article, articleDetails) {
  $scope.article = article;
  $scope.articleDetails = articleDetails;  
}]);
```

Registering an observer via `#observe()` returns a handle to the created observer. The handle can be used to query the status of the observed data:

```javascript
handle.$loaded; // false if any of the required data elements are currently loading
handle.$error;  // error if any occured during loading the observed dependencies
```

#### Notes

To re-use a data container in a child scope, a child instance bound to the specific scope should be created: 

```javascript
var $childData = $data.newChild(childScope);
```

This ensures that all observer and producer bindings registered in the child scope are properly cleaned up.


## Building the Project

1.   Fork + clone [the repository](https://github.com/Nikku/angular-data-depend).
2.   Install dependencies via `npm install`.
3.   Build the library via `grunt`.


## License

Use under terms of MIT license.