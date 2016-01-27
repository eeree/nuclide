Object.defineProperty(exports, '__esModule', {
  value: true
});

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

exports.isTextEditor = isTextEditor;
exports.createTextEditor = createTextEditor;
exports.editorForPath = editorForPath;

function isTextEditor(item) {
  if (item == null) {
    return false;
  } else if (typeof atom.workspace.buildTextEditor === 'function') {
    // If buildTextEditor is present, then accessing the TextEditor constructor will trigger a
    // deprecation warning. Atom recommends testing for the existence of the public method of
    // TextEditor that you are using as a proxy for whether the object is a TextEditor:
    // https://github.com/atom/atom/commit/4d2d4c3. This is a fairly weak heuristic, so we test
    // for a larger set of methods that are more likely unique to TextEditor as a better heuristic:
    return typeof item.screenPositionForBufferPosition === 'function' && typeof item.scanInBufferRange === 'function' && typeof item.scopeDescriptorForBufferPosition === 'function';
  } else {
    var _require = require('atom');

    var _TextEditor = _require.TextEditor;

    return item instanceof _TextEditor;
  }
}

function createTextEditor(textEditorParams) {
  // Note that atom.workspace.buildTextEditor was introduced after the release of Atom 1.0.19.
  // As of this change, calling the constructor of TextEditor directly is deprecated. Therefore,
  // we must choose the appropriate code path based on which API is available.
  if (atom.workspace.buildTextEditor) {
    return atom.workspace.buildTextEditor(textEditorParams);
  } else {
    var _require2 = require('atom');

    var _TextEditor2 = _require2.TextEditor;

    return new _TextEditor2(textEditorParams);
  }
}

/**
 * Returns a text editor that has the given path open, or null if none exists. If there are multiple
 * text editors for this path, one is chosen arbitrarily.
 */

function editorForPath(path) {
  // This isn't ideal but realistically iterating through even a few hundred editors shouldn't be a
  // real problem. And if you have more than a few hundred you probably have bigger problems.
  for (var editor of atom.workspace.getTextEditors()) {
    if (editor.getPath() === path) {
      return editor;
    }
  }

  return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRleHQtZWRpdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFhTyxTQUFTLFlBQVksQ0FBQyxJQUFVLEVBQVc7QUFDaEQsTUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO0FBQ2hCLFdBQU8sS0FBSyxDQUFDO0dBQ2QsTUFBTSxJQUFJLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEtBQUssVUFBVSxFQUFFOzs7Ozs7QUFNL0QsV0FBTyxPQUFPLElBQUksQ0FBQywrQkFBK0IsS0FBSyxVQUFVLElBQy9ELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixLQUFLLFVBQVUsSUFDNUMsT0FBTyxJQUFJLENBQUMsZ0NBQWdDLEtBQUssVUFBVSxDQUFDO0dBQy9ELE1BQU07bUJBQ2dCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O1FBQTdCLFdBQVUsWUFBVixVQUFVOztBQUNqQixXQUFPLElBQUksWUFBWSxXQUFVLENBQUM7R0FDbkM7Q0FDRjs7QUFFTSxTQUFTLGdCQUFnQixDQUFDLGdCQUF1QyxFQUFjOzs7O0FBSXBGLE1BQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUU7QUFDbEMsV0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0dBQ3pELE1BQU07b0JBQ2dCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O1FBQTdCLFlBQVUsYUFBVixVQUFVOztBQUNqQixXQUFPLElBQUksWUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUM7R0FDekM7Q0FDRjs7Ozs7OztBQU1NLFNBQVMsYUFBYSxDQUFDLElBQWdCLEVBQW9COzs7QUFHaEUsT0FBSyxJQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxFQUFFO0FBQ3BELFFBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLElBQUksRUFBRTtBQUM3QixhQUFPLE1BQU0sQ0FBQztLQUNmO0dBQ0Y7O0FBRUQsU0FBTyxJQUFJLENBQUM7Q0FDYiIsImZpbGUiOiJ0ZXh0LWVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtOdWNsaWRlVXJpfSBmcm9tICcuLi8uLi9yZW1vdGUtdXJpJztcblxuZXhwb3J0IGZ1bmN0aW9uIGlzVGV4dEVkaXRvcihpdGVtOiA/YW55KTogYm9vbGVhbiB7XG4gIGlmIChpdGVtID09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGF0b20ud29ya3NwYWNlLmJ1aWxkVGV4dEVkaXRvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIElmIGJ1aWxkVGV4dEVkaXRvciBpcyBwcmVzZW50LCB0aGVuIGFjY2Vzc2luZyB0aGUgVGV4dEVkaXRvciBjb25zdHJ1Y3RvciB3aWxsIHRyaWdnZXIgYVxuICAgIC8vIGRlcHJlY2F0aW9uIHdhcm5pbmcuIEF0b20gcmVjb21tZW5kcyB0ZXN0aW5nIGZvciB0aGUgZXhpc3RlbmNlIG9mIHRoZSBwdWJsaWMgbWV0aG9kIG9mXG4gICAgLy8gVGV4dEVkaXRvciB0aGF0IHlvdSBhcmUgdXNpbmcgYXMgYSBwcm94eSBmb3Igd2hldGhlciB0aGUgb2JqZWN0IGlzIGEgVGV4dEVkaXRvcjpcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tL2NvbW1pdC80ZDJkNGMzLiBUaGlzIGlzIGEgZmFpcmx5IHdlYWsgaGV1cmlzdGljLCBzbyB3ZSB0ZXN0XG4gICAgLy8gZm9yIGEgbGFyZ2VyIHNldCBvZiBtZXRob2RzIHRoYXQgYXJlIG1vcmUgbGlrZWx5IHVuaXF1ZSB0byBUZXh0RWRpdG9yIGFzIGEgYmV0dGVyIGhldXJpc3RpYzpcbiAgICByZXR1cm4gdHlwZW9mIGl0ZW0uc2NyZWVuUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbiA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgdHlwZW9mIGl0ZW0uc2NhbkluQnVmZmVyUmFuZ2UgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIHR5cGVvZiBpdGVtLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uID09PSAnZnVuY3Rpb24nO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHtUZXh0RWRpdG9yfSA9IHJlcXVpcmUoJ2F0b20nKTtcbiAgICByZXR1cm4gaXRlbSBpbnN0YW5jZW9mIFRleHRFZGl0b3I7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHRFZGl0b3IodGV4dEVkaXRvclBhcmFtczogYXRvbSRUZXh0RWRpdG9yUGFyYW1zKTogVGV4dEVkaXRvciB7XG4gIC8vIE5vdGUgdGhhdCBhdG9tLndvcmtzcGFjZS5idWlsZFRleHRFZGl0b3Igd2FzIGludHJvZHVjZWQgYWZ0ZXIgdGhlIHJlbGVhc2Ugb2YgQXRvbSAxLjAuMTkuXG4gIC8vIEFzIG9mIHRoaXMgY2hhbmdlLCBjYWxsaW5nIHRoZSBjb25zdHJ1Y3RvciBvZiBUZXh0RWRpdG9yIGRpcmVjdGx5IGlzIGRlcHJlY2F0ZWQuIFRoZXJlZm9yZSxcbiAgLy8gd2UgbXVzdCBjaG9vc2UgdGhlIGFwcHJvcHJpYXRlIGNvZGUgcGF0aCBiYXNlZCBvbiB3aGljaCBBUEkgaXMgYXZhaWxhYmxlLlxuICBpZiAoYXRvbS53b3Jrc3BhY2UuYnVpbGRUZXh0RWRpdG9yKSB7XG4gICAgcmV0dXJuIGF0b20ud29ya3NwYWNlLmJ1aWxkVGV4dEVkaXRvcih0ZXh0RWRpdG9yUGFyYW1zKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB7VGV4dEVkaXRvcn0gPSByZXF1aXJlKCdhdG9tJyk7XG4gICAgcmV0dXJuIG5ldyBUZXh0RWRpdG9yKHRleHRFZGl0b3JQYXJhbXMpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHRleHQgZWRpdG9yIHRoYXQgaGFzIHRoZSBnaXZlbiBwYXRoIG9wZW4sIG9yIG51bGwgaWYgbm9uZSBleGlzdHMuIElmIHRoZXJlIGFyZSBtdWx0aXBsZVxuICogdGV4dCBlZGl0b3JzIGZvciB0aGlzIHBhdGgsIG9uZSBpcyBjaG9zZW4gYXJiaXRyYXJpbHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlZGl0b3JGb3JQYXRoKHBhdGg6IE51Y2xpZGVVcmkpOiA/YXRvbSRUZXh0RWRpdG9yIHtcbiAgLy8gVGhpcyBpc24ndCBpZGVhbCBidXQgcmVhbGlzdGljYWxseSBpdGVyYXRpbmcgdGhyb3VnaCBldmVuIGEgZmV3IGh1bmRyZWQgZWRpdG9ycyBzaG91bGRuJ3QgYmUgYVxuICAvLyByZWFsIHByb2JsZW0uIEFuZCBpZiB5b3UgaGF2ZSBtb3JlIHRoYW4gYSBmZXcgaHVuZHJlZCB5b3UgcHJvYmFibHkgaGF2ZSBiaWdnZXIgcHJvYmxlbXMuXG4gIGZvciAoY29uc3QgZWRpdG9yIG9mIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkpIHtcbiAgICBpZiAoZWRpdG9yLmdldFBhdGgoKSA9PT0gcGF0aCkge1xuICAgICAgcmV0dXJuIGVkaXRvcjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==