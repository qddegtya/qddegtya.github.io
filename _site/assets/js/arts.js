(function(root, doc) {

  root.artsGenerator = function(srcNode) {
    // utils
    var artNode = srcNode,
        geNode = doc.getElementById('artsContainer'),
        artsTempHtml = artNode.innerHTML,
        _push = Array.prototype.push,
        taskFragList,
        callstacks = [],
        outerScopeDiv,

        // reg list
        spReg = /(^\s*)|(\s*$)/g,
        pjReg = /^(--)\((((http:\/\/|https:\/\/)(.*))(\s){1,}\"(.*)\")\)\[(.*)\]$/i,

        _trim = function(str) {
          return str.replace(spReg, '');
        },

        _addClass = function(el, className) {
          el.setAttribute('class', className.join(' '));
          return el;
        },

        _startWith = function(str, originStr) {
          var _rg = new RegExp('^' + str);
          _rg.ignoreCase = true;
          return _rg.test(originStr);
        },

        _isSpace = function(el) {
          return el === '';
        },

        _addChilds = function(childs, parent) {
          childs.map(function(child) {
            parent.appendChild(child);
          });
        },

        _geHtmlDiv = function(html, className, parentNode) {
          var node = document.createElement('div');

          _addClass(node, className);
          node.innerHTML = html;

          return function(cb) {
            cb(node, parentNode);
          };
        },

        _createDiv = function(className) {
          var node = null;
          return function() {
            if(node) {
              return node;
            } else {
              node = document.createElement('div');
              _addClass(node, [className, 'wrapper', 'clearfix']);
              return node;
            }
          };
        },

        _filter = function(lists, filter, handler) {
          var tmp = [];
          lists.map(function(el) {
            if(filter(el)) {
              return;
            } else {
              tmp.push(handler(el));
            }
          });
          return tmp;
        };


    // start handle
    var taskFragList = artsTempHtml.split('\n');
    var _tmpLates = _filter(taskFragList, _isSpace, _trim);

    // init
    _tmpLates.map(function(tp, index) {
      if(_startWith('__', tp)) {
        callstacks.push(
          _geHtmlDiv(
            _trim(tp.replace(/__/i, '')),
            ['arts-title'],
            geNode
          )
        );
      } else if(_startWith('##', tp)) {
        outerScopeDiv = _createDiv('outer-scope-' + index);
        callstacks.push(
          _geHtmlDiv(
            _trim(tp.replace(/##/i, '')),
            ['title'],
            geNode
          )
        );
      } else if(_startWith('--', tp)) {
        callstacks.push(
          _geHtmlDiv(
            tp.replace(
              pjReg,
              [
                '<div class="project-item-box">',
                  '<img src="',
                    '$8',
                  '" class="item-img">',
                  '<div class="item-des" data-url="$3">',
                    '<span class="item-des-span">',
                     '$7',
                    '</span>',
                  '</div>',
                '</div>'
              ].join('')
            ),
            ['project-item'],
            outerScopeDiv()
          )
        );
      } else {
        return;
      }
    });

    // callstacks invoke
    callstacks.map(function(cb) {
      cb(function(node, pnode) {
        pnode.appendChild(node);
        if(pnode !== geNode) {
          geNode.appendChild(pnode);
        }
      });
    });

    // copyright
    var _copy = document.createElement('div');
    _copy.innerHTML = 'Powered By <a href="https://github.com/qddegtya/a-Arts">a-Arts</a>'
    _addClass(_copy, ['copyright']);
    geNode.appendChild(_copy);
  };

  // click event
  document.getElementById('artsContainer')
          .addEventListener('click', function(e) {
            var _self = e.target;
            if(
              _self.className === 'item-des' ||
              _self.parentNode.className === 'item-des'
             ) {
              window.location.href = _self.getAttribute('data-url') ||
                                     _self.parentNode.getAttribute('data-url');
            }
          });
})(this, document);
