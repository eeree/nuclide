

/**
 * @param revision A string representation of the revision desired. See
 * Mercurial documentation for ways to specify a revision.
 * @return The content of the filePath at the given revision. Returns null
 * if the operation fails for whatever reason, including invalid input (e.g. if
 * you pass an invalid revision).
 */

var fetchFilesChangedAtRevision = _asyncToGenerator(function* (revision, workingDirectory) {
  var args = ['log', '--template', REVISION_FILE_CHANGES_TEMPLATE, '--rev', revision];
  var execOptions = {
    cwd: workingDirectory
  };
  var output = yield hgAsyncExecute(args, execOptions);
  if (output) {
    output = parseRevisionFileChangeOutput(output, workingDirectory);
  }
  return output;
}

/**
 * @param output Raw output string from 'hg log' call in `fetchFilesChangedAtRevision`.
 * @param workingDirectory The absolute path to the working directory of the hg repository.
 * @return A RevisionFileChanges object where the paths are all absolute paths.
 */
);

var hgAsyncExecute = _asyncToGenerator(function* (args, execOptions) {
  var output = undefined;
  try {
    output = yield asyncExecute('hg', args, execOptions);
  } catch (e) {
    logger.error('Hg command: failed with error: ', e.stderr);
    return null;
  }
  return output.stdout;
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _require = require('../../commons');

var asyncExecute = _require.asyncExecute;

var logger = require('../../logging').getLogger();
var path = require('path');

var ALL_FILES_LABEL = 'files:';
var FILE_ADDS_LABEL = 'file-adds:';
var FILE_DELETES_LABEL = 'file-dels:';
var FILE_COPIES_LABEL = 'file-copies:';
var FILE_MODS_LABEL = 'file-mods:';
var REVISION_FILE_CHANGES_TEMPLATE = ALL_FILES_LABEL + ' {files}\n' + FILE_ADDS_LABEL + ' {file_adds}\n' + FILE_DELETES_LABEL + ' {file_dels}\n' + FILE_COPIES_LABEL + ' {file_copies}\n' + FILE_MODS_LABEL + ' {file_mods}';
// Regex for: "new_file (previous_file", with two capture groups, one for each file.
var COPIED_FILE_PAIR_REGEX = /(.+) \((.+)/;

/**
 * @param filePath An absolute path to a file.
 * @param revision A string representation of the revision desired. See
 * Mercurial documentation for ways to specify a revision.
 * @param The working directory (aka root directory) of the Hg repository.
 * @return The content of the filePath at the given revision. Returns null
 * if the operation fails for whatever reason, including invalid input (e.g. if
 * you pass a filePath that does not exist at the given revision).
 */
function fetchFileContentAtRevision(filePath, revision, workingDirectory) {
  var args = ['cat', filePath];
  if (revision) {
    args.splice(1, 0, '--rev', revision);
  }
  var execOptions = {
    cwd: workingDirectory
  };
  return hgAsyncExecute(args, execOptions);
}function parseRevisionFileChangeOutput(output, workingDirectory) {
  var lines = output.trim().split('\n');
  var allFiles = lines[0].slice(ALL_FILES_LABEL.length + 1).trim();
  allFiles = allFiles.length ? allFiles.split(' ') : [];
  allFiles = absolutizeAll(allFiles, workingDirectory);

  var addedFiles = lines[1].slice(FILE_ADDS_LABEL.length + 1).trim();
  addedFiles = addedFiles.length ? addedFiles.split(' ') : [];
  addedFiles = absolutizeAll(addedFiles, workingDirectory);

  var deletedFiles = lines[2].slice(FILE_DELETES_LABEL.length + 1).trim();
  deletedFiles = deletedFiles.length ? deletedFiles.split(' ') : [];
  deletedFiles = absolutizeAll(deletedFiles, workingDirectory);

  // Copied files are in the form: new_file (previous_file)new_file2 (previous_file2)[...]
  // There is no space between entries.
  var copiedFiles = lines[3].slice(FILE_COPIES_LABEL.length + 1).trim();
  copiedFiles = copiedFiles.length ? copiedFiles.split(')') : [];
  // We expect the string to end with a ')', so the last entry in copiedFiles will
  // be an empty string. Remove this.
  copiedFiles.pop();
  // Parse the lines, now in the form: new_file (previous_file)
  copiedFiles = copiedFiles.map(function (filePathPair) {
    var fileNameMatches = filePathPair.match(COPIED_FILE_PAIR_REGEX);
    (0, _assert2['default'])(fileNameMatches);
    return {
      from: absolutize(fileNameMatches[2], workingDirectory),
      to: absolutize(fileNameMatches[1], workingDirectory)
    };
  });

  var modifiedFiles = lines[4].slice(FILE_MODS_LABEL.length + 1).trim();
  modifiedFiles = modifiedFiles.length ? modifiedFiles.split(' ') : [];
  modifiedFiles = absolutizeAll(modifiedFiles, workingDirectory);

  return {
    all: allFiles,
    added: addedFiles,
    deleted: deletedFiles,
    copied: copiedFiles,
    modified: modifiedFiles
  };
}

function absolutize(filePath, workingDirectory) {
  return path.join(workingDirectory, filePath);
}

function absolutizeAll(filePaths, workingDirectory) {
  return filePaths.map(function (filePath) {
    return absolutize(filePath, workingDirectory);
  });
}

module.exports = {
  fetchFileContentAtRevision: fetchFileContentAtRevision,
  fetchFilesChangedAtRevision: fetchFilesChangedAtRevision,
  parseRevisionFileChangeOutput: parseRevisionFileChangeOutput };
// exposed for testing
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhnLXJldmlzaW9uLXN0YXRlLWhlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztJQWlFZSwyQkFBMkIscUJBQTFDLFdBQ0UsUUFBZ0IsRUFDaEIsZ0JBQXdCLEVBQ087QUFDL0IsTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLDhCQUE4QixFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN0RixNQUFNLFdBQVcsR0FBRztBQUNsQixPQUFHLEVBQUUsZ0JBQWdCO0dBQ3RCLENBQUM7QUFDRixNQUFJLE1BQU0sR0FBRyxNQUFNLGNBQWMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDckQsTUFBSSxNQUFNLEVBQUU7QUFDVixVQUFNLEdBQUcsNkJBQTZCLENBQUMsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7R0FDbEU7QUFDRCxTQUFPLE1BQU0sQ0FBQztDQUNmOzs7Ozs7Ozs7SUF1RGMsY0FBYyxxQkFBN0IsV0FBOEIsSUFBbUIsRUFBRSxXQUFnQixFQUFnQjtBQUNqRixNQUFJLE1BQU0sWUFBQSxDQUFDO0FBQ1gsTUFBSTtBQUNGLFVBQU0sR0FBRyxNQUFNLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0dBQ3RELENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDVixVQUFNLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMxRCxXQUFPLElBQUksQ0FBQztHQUNiO0FBQ0QsU0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDO0NBQ3RCOzs7Ozs7Ozs7Ozs7OztzQkE3SHFCLFFBQVE7Ozs7ZUFIUCxPQUFPLENBQUMsZUFBZSxDQUFDOztJQUF4QyxZQUFZLFlBQVosWUFBWTs7QUFDbkIsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3BELElBQU0sSUFB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QTJCO0FBQzNCLCtCQUE2QixFQUE3Qiw2QkFBNkIsRUFDOUIsQ0FBQyIsImZpbGUiOiJoZy1yZXZpc2lvbi1zdGF0ZS1oZWxwZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge1JldmlzaW9uRmlsZUNoYW5nZXN9IGZyb20gJy4vaGctY29uc3RhbnRzJztcbmltcG9ydCB0eXBlIHtOdWNsaWRlVXJpfSBmcm9tICcuLi8uLi9yZW1vdGUtdXJpJztcblxuY29uc3Qge2FzeW5jRXhlY3V0ZX0gPSByZXF1aXJlKCcuLi8uLi9jb21tb25zJyk7XG5jb25zdCBsb2dnZXIgPSByZXF1aXJlKCcuLi8uLi9sb2dnaW5nJykuZ2V0TG9nZ2VyKCk7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBBTExfRklMRVNfTEFCRUwgPSAnZmlsZXM6JztcbmNvbnN0IEZJTEVfQUREU19MQUJFTCA9ICdmaWxlLWFkZHM6JztcbmNvbnN0IEZJTEVfREVMRVRFU19MQUJFTCA9ICdmaWxlLWRlbHM6JztcbmNvbnN0IEZJTEVfQ09QSUVTX0xBQkVMID0gJ2ZpbGUtY29waWVzOic7XG5jb25zdCBGSUxFX01PRFNfTEFCRUwgPSAnZmlsZS1tb2RzOic7XG5jb25zdCBSRVZJU0lPTl9GSUxFX0NIQU5HRVNfVEVNUExBVEUgPVxuYCR7QUxMX0ZJTEVTX0xBQkVMfSB7ZmlsZXN9XG4ke0ZJTEVfQUREU19MQUJFTH0ge2ZpbGVfYWRkc31cbiR7RklMRV9ERUxFVEVTX0xBQkVMfSB7ZmlsZV9kZWxzfVxuJHtGSUxFX0NPUElFU19MQUJFTH0ge2ZpbGVfY29waWVzfVxuJHtGSUxFX01PRFNfTEFCRUx9IHtmaWxlX21vZHN9YDtcbi8vIFJlZ2V4IGZvcjogXCJuZXdfZmlsZSAocHJldmlvdXNfZmlsZVwiLCB3aXRoIHR3byBjYXB0dXJlIGdyb3Vwcywgb25lIGZvciBlYWNoIGZpbGUuXG5jb25zdCBDT1BJRURfRklMRV9QQUlSX1JFR0VYID0gLyguKykgXFwoKC4rKS87XG5cblxuLyoqXG4gKiBAcGFyYW0gZmlsZVBhdGggQW4gYWJzb2x1dGUgcGF0aCB0byBhIGZpbGUuXG4gKiBAcGFyYW0gcmV2aXNpb24gQSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHJldmlzaW9uIGRlc2lyZWQuIFNlZVxuICogTWVyY3VyaWFsIGRvY3VtZW50YXRpb24gZm9yIHdheXMgdG8gc3BlY2lmeSBhIHJldmlzaW9uLlxuICogQHBhcmFtIFRoZSB3b3JraW5nIGRpcmVjdG9yeSAoYWthIHJvb3QgZGlyZWN0b3J5KSBvZiB0aGUgSGcgcmVwb3NpdG9yeS5cbiAqIEByZXR1cm4gVGhlIGNvbnRlbnQgb2YgdGhlIGZpbGVQYXRoIGF0IHRoZSBnaXZlbiByZXZpc2lvbi4gUmV0dXJucyBudWxsXG4gKiBpZiB0aGUgb3BlcmF0aW9uIGZhaWxzIGZvciB3aGF0ZXZlciByZWFzb24sIGluY2x1ZGluZyBpbnZhbGlkIGlucHV0IChlLmcuIGlmXG4gKiB5b3UgcGFzcyBhIGZpbGVQYXRoIHRoYXQgZG9lcyBub3QgZXhpc3QgYXQgdGhlIGdpdmVuIHJldmlzaW9uKS5cbiAqL1xuZnVuY3Rpb24gZmV0Y2hGaWxlQ29udGVudEF0UmV2aXNpb24oXG4gIGZpbGVQYXRoOiBOdWNsaWRlVXJpLFxuICByZXZpc2lvbjogP3N0cmluZyxcbiAgd29ya2luZ0RpcmVjdG9yeTogc3RyaW5nLFxuKTogUHJvbWlzZTw/c3RyaW5nPiB7XG4gIGNvbnN0IGFyZ3MgPSBbJ2NhdCcsIGZpbGVQYXRoXTtcbiAgaWYgKHJldmlzaW9uKSB7XG4gICAgYXJncy5zcGxpY2UoMSwgMCwgJy0tcmV2JywgcmV2aXNpb24pO1xuICB9XG4gIGNvbnN0IGV4ZWNPcHRpb25zID0ge1xuICAgIGN3ZDogd29ya2luZ0RpcmVjdG9yeSxcbiAgfTtcbiAgcmV0dXJuIGhnQXN5bmNFeGVjdXRlKGFyZ3MsIGV4ZWNPcHRpb25zKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gcmV2aXNpb24gQSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHJldmlzaW9uIGRlc2lyZWQuIFNlZVxuICogTWVyY3VyaWFsIGRvY3VtZW50YXRpb24gZm9yIHdheXMgdG8gc3BlY2lmeSBhIHJldmlzaW9uLlxuICogQHJldHVybiBUaGUgY29udGVudCBvZiB0aGUgZmlsZVBhdGggYXQgdGhlIGdpdmVuIHJldmlzaW9uLiBSZXR1cm5zIG51bGxcbiAqIGlmIHRoZSBvcGVyYXRpb24gZmFpbHMgZm9yIHdoYXRldmVyIHJlYXNvbiwgaW5jbHVkaW5nIGludmFsaWQgaW5wdXQgKGUuZy4gaWZcbiAqIHlvdSBwYXNzIGFuIGludmFsaWQgcmV2aXNpb24pLlxuICovXG5hc3luYyBmdW5jdGlvbiBmZXRjaEZpbGVzQ2hhbmdlZEF0UmV2aXNpb24oXG4gIHJldmlzaW9uOiBzdHJpbmcsXG4gIHdvcmtpbmdEaXJlY3Rvcnk6IHN0cmluZyxcbik6IFByb21pc2U8P1JldmlzaW9uRmlsZUNoYW5nZXM+IHtcbiAgY29uc3QgYXJncyA9IFsnbG9nJywgJy0tdGVtcGxhdGUnLCBSRVZJU0lPTl9GSUxFX0NIQU5HRVNfVEVNUExBVEUsICctLXJldicsIHJldmlzaW9uXTtcbiAgY29uc3QgZXhlY09wdGlvbnMgPSB7XG4gICAgY3dkOiB3b3JraW5nRGlyZWN0b3J5LFxuICB9O1xuICBsZXQgb3V0cHV0ID0gYXdhaXQgaGdBc3luY0V4ZWN1dGUoYXJncywgZXhlY09wdGlvbnMpO1xuICBpZiAob3V0cHV0KSB7XG4gICAgb3V0cHV0ID0gcGFyc2VSZXZpc2lvbkZpbGVDaGFuZ2VPdXRwdXQob3V0cHV0LCB3b3JraW5nRGlyZWN0b3J5KTtcbiAgfVxuICByZXR1cm4gb3V0cHV0O1xufVxuXG4vKipcbiAqIEBwYXJhbSBvdXRwdXQgUmF3IG91dHB1dCBzdHJpbmcgZnJvbSAnaGcgbG9nJyBjYWxsIGluIGBmZXRjaEZpbGVzQ2hhbmdlZEF0UmV2aXNpb25gLlxuICogQHBhcmFtIHdvcmtpbmdEaXJlY3RvcnkgVGhlIGFic29sdXRlIHBhdGggdG8gdGhlIHdvcmtpbmcgZGlyZWN0b3J5IG9mIHRoZSBoZyByZXBvc2l0b3J5LlxuICogQHJldHVybiBBIFJldmlzaW9uRmlsZUNoYW5nZXMgb2JqZWN0IHdoZXJlIHRoZSBwYXRocyBhcmUgYWxsIGFic29sdXRlIHBhdGhzLlxuICovXG5mdW5jdGlvbiBwYXJzZVJldmlzaW9uRmlsZUNoYW5nZU91dHB1dChcbiAgb3V0cHV0OiBzdHJpbmcsXG4gIHdvcmtpbmdEaXJlY3Rvcnk6IHN0cmluZyxcbik6IFJldmlzaW9uRmlsZUNoYW5nZXMge1xuICBjb25zdCBsaW5lcyA9IG91dHB1dC50cmltKCkuc3BsaXQoJ1xcbicpO1xuICBsZXQgYWxsRmlsZXMgPSBsaW5lc1swXS5zbGljZShBTExfRklMRVNfTEFCRUwubGVuZ3RoICsgMSkudHJpbSgpO1xuICBhbGxGaWxlcyA9IGFsbEZpbGVzLmxlbmd0aCA/IGFsbEZpbGVzLnNwbGl0KCcgJykgOiBbXTtcbiAgYWxsRmlsZXMgPSBhYnNvbHV0aXplQWxsKGFsbEZpbGVzLCB3b3JraW5nRGlyZWN0b3J5KTtcblxuICBsZXQgYWRkZWRGaWxlcyA9IGxpbmVzWzFdLnNsaWNlKEZJTEVfQUREU19MQUJFTC5sZW5ndGggKyAxKS50cmltKCk7XG4gIGFkZGVkRmlsZXMgPSBhZGRlZEZpbGVzLmxlbmd0aCA/IGFkZGVkRmlsZXMuc3BsaXQoJyAnKSA6IFtdO1xuICBhZGRlZEZpbGVzID0gYWJzb2x1dGl6ZUFsbChhZGRlZEZpbGVzLCB3b3JraW5nRGlyZWN0b3J5KTtcblxuICBsZXQgZGVsZXRlZEZpbGVzID0gbGluZXNbMl0uc2xpY2UoRklMRV9ERUxFVEVTX0xBQkVMLmxlbmd0aCArIDEpLnRyaW0oKTtcbiAgZGVsZXRlZEZpbGVzID0gZGVsZXRlZEZpbGVzLmxlbmd0aCA/IGRlbGV0ZWRGaWxlcy5zcGxpdCgnICcpIDogW107XG4gIGRlbGV0ZWRGaWxlcyA9IGFic29sdXRpemVBbGwoZGVsZXRlZEZpbGVzLCB3b3JraW5nRGlyZWN0b3J5KTtcblxuICAvLyBDb3BpZWQgZmlsZXMgYXJlIGluIHRoZSBmb3JtOiBuZXdfZmlsZSAocHJldmlvdXNfZmlsZSluZXdfZmlsZTIgKHByZXZpb3VzX2ZpbGUyKVsuLi5dXG4gIC8vIFRoZXJlIGlzIG5vIHNwYWNlIGJldHdlZW4gZW50cmllcy5cbiAgbGV0IGNvcGllZEZpbGVzID0gbGluZXNbM10uc2xpY2UoRklMRV9DT1BJRVNfTEFCRUwubGVuZ3RoICsgMSkudHJpbSgpO1xuICBjb3BpZWRGaWxlcyA9IGNvcGllZEZpbGVzLmxlbmd0aCA/IGNvcGllZEZpbGVzLnNwbGl0KCcpJykgOiBbXTtcbiAgLy8gV2UgZXhwZWN0IHRoZSBzdHJpbmcgdG8gZW5kIHdpdGggYSAnKScsIHNvIHRoZSBsYXN0IGVudHJ5IGluIGNvcGllZEZpbGVzIHdpbGxcbiAgLy8gYmUgYW4gZW1wdHkgc3RyaW5nLiBSZW1vdmUgdGhpcy5cbiAgY29waWVkRmlsZXMucG9wKCk7XG4gIC8vIFBhcnNlIHRoZSBsaW5lcywgbm93IGluIHRoZSBmb3JtOiBuZXdfZmlsZSAocHJldmlvdXNfZmlsZSlcbiAgY29waWVkRmlsZXMgPSBjb3BpZWRGaWxlcy5tYXAoKGZpbGVQYXRoUGFpcikgPT4ge1xuICAgIGNvbnN0IGZpbGVOYW1lTWF0Y2hlcyA9IGZpbGVQYXRoUGFpci5tYXRjaChDT1BJRURfRklMRV9QQUlSX1JFR0VYKTtcbiAgICBpbnZhcmlhbnQoZmlsZU5hbWVNYXRjaGVzKTtcbiAgICByZXR1cm4ge1xuICAgICAgZnJvbTogYWJzb2x1dGl6ZShmaWxlTmFtZU1hdGNoZXNbMl0sIHdvcmtpbmdEaXJlY3RvcnkpLFxuICAgICAgdG86IGFic29sdXRpemUoZmlsZU5hbWVNYXRjaGVzWzFdLCB3b3JraW5nRGlyZWN0b3J5KSxcbiAgICB9O1xuICB9KTtcblxuICBsZXQgbW9kaWZpZWRGaWxlcyA9IGxpbmVzWzRdLnNsaWNlKEZJTEVfTU9EU19MQUJFTC5sZW5ndGggKyAxKS50cmltKCk7XG4gIG1vZGlmaWVkRmlsZXMgPSBtb2RpZmllZEZpbGVzLmxlbmd0aCA/IG1vZGlmaWVkRmlsZXMuc3BsaXQoJyAnKSA6IFtdO1xuICBtb2RpZmllZEZpbGVzID0gYWJzb2x1dGl6ZUFsbChtb2RpZmllZEZpbGVzLCB3b3JraW5nRGlyZWN0b3J5KTtcblxuICByZXR1cm4ge1xuICAgIGFsbDogYWxsRmlsZXMsXG4gICAgYWRkZWQ6IGFkZGVkRmlsZXMsXG4gICAgZGVsZXRlZDogZGVsZXRlZEZpbGVzLFxuICAgIGNvcGllZDogY29waWVkRmlsZXMsXG4gICAgbW9kaWZpZWQ6IG1vZGlmaWVkRmlsZXMsXG4gIH07XG59XG5cblxuYXN5bmMgZnVuY3Rpb24gaGdBc3luY0V4ZWN1dGUoYXJnczogQXJyYXk8c3RyaW5nPiwgZXhlY09wdGlvbnM6IGFueSk6IFByb21pc2U8YW55PiB7XG4gIGxldCBvdXRwdXQ7XG4gIHRyeSB7XG4gICAgb3V0cHV0ID0gYXdhaXQgYXN5bmNFeGVjdXRlKCdoZycsIGFyZ3MsIGV4ZWNPcHRpb25zKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZ2dlci5lcnJvcignSGcgY29tbWFuZDogZmFpbGVkIHdpdGggZXJyb3I6ICcsIGUuc3RkZXJyKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gb3V0cHV0LnN0ZG91dDtcbn1cblxuZnVuY3Rpb24gYWJzb2x1dGl6ZShmaWxlUGF0aDogc3RyaW5nLCB3b3JraW5nRGlyZWN0b3J5OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5qb2luKHdvcmtpbmdEaXJlY3RvcnksIGZpbGVQYXRoKTtcbn1cblxuZnVuY3Rpb24gYWJzb2x1dGl6ZUFsbChmaWxlUGF0aHM6IEFycmF5PHN0cmluZz4sIHdvcmtpbmdEaXJlY3Rvcnk6IHN0cmluZykge1xuICByZXR1cm4gZmlsZVBhdGhzLm1hcChmaWxlUGF0aCA9PiBhYnNvbHV0aXplKGZpbGVQYXRoLCB3b3JraW5nRGlyZWN0b3J5KSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBmZXRjaEZpbGVDb250ZW50QXRSZXZpc2lvbixcbiAgZmV0Y2hGaWxlc0NoYW5nZWRBdFJldmlzaW9uLFxuICBwYXJzZVJldmlzaW9uRmlsZUNoYW5nZU91dHB1dCwgLy8gZXhwb3NlZCBmb3IgdGVzdGluZ1xufTtcbiJdfQ==