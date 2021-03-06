'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {
  createTextEditor,
  isTextEditor,
  existingEditorForUri,
  existingBufferForUri,
  bufferForUri,
} from '..';

describe('isTextEditor', () => {
  it('returns appropriate value for various inputs', () => {
    expect(isTextEditor(null)).toBe(false);
    expect(isTextEditor(undefined)).toBe(false);
    expect(isTextEditor(42)).toBe(false);
    expect(isTextEditor(false)).toBe(false);
    expect(isTextEditor('TextEditor')).toBe(false);
    expect(isTextEditor([])).toBe(false);
    expect(isTextEditor({})).toBe(false);

    const textEditor = createTextEditor(/* params */ {});
    expect(isTextEditor(textEditor)).toBe(true);
  });
});

describe('existingEditorForUri', () => {
  const file1 = '/tmp/file1.txt';
  const file2 = '/tmp/file2.txt';
  const file3 = '/tmp/file3.txt';

  let file1Editor: atom$TextEditor = (null: any);
  let file2Editor: atom$TextEditor = (null: any);
  let secondFile2Editor: atom$TextEditor = (null: any);

  beforeEach(() => {
    waitsForPromise(async () => {
      file1Editor = await atom.workspace.open(file1);
      file2Editor = await atom.workspace.open(file2);
      secondFile2Editor = await atom.workspace.open(file2);
    });
  });

  it('should find the one editor for a file', () => {
    expect(existingEditorForUri(file1)).toBe(file1Editor);
  });

  it('should find one of the editors for a file', () => {
    const editor = existingEditorForUri(file2);
    expect(editor === file2Editor || editor === secondFile2Editor).toBeTruthy();
  });

  it('should return null if no editor exists', () => {
    expect(existingEditorForUri(file3)).toBeNull();
  });
});

describe('existingBufferForUri', () => {
  const file1 = '/tmp/file1.txt';

  it('should open an editor with the same buffer, if previously cached', () => {
    const existingBuffer = existingBufferForUri(file1);
    expect(existingBuffer).toBeUndefined();
    waitsForPromise(async () => {
      const secondFile1Buffer = (await atom.workspace.open(file1)).getBuffer();
      expect(secondFile1Buffer).toBeDefined();
      const bufferAfterCreation = existingBufferForUri(file1);
      expect(bufferAfterCreation).toBeDefined();
    });
  });
});

describe('bufferForUri', () => {
  const file1 = '/tmp/file1.txt';
  const file2 = '/tmp/file2.txt';

  let file1Buffer: atom$TextBuffer = (null: any);

  beforeEach(() => {
    file1Buffer = bufferForUri(file1);
  });

  it('should open an editor with the same buffer, if previously cached', () => {
    waitsForPromise(async () => {
      const secondFile1Buffer = (await atom.workspace.open(file1)).getBuffer();
      expect(secondFile1Buffer).toBe(file1Buffer);
    });
  });

  it('should return the same buffer after creating an editor for it', () => {
    waitsForPromise(async () => {
      const file2Buffer = (await atom.workspace.open(file2)).getBuffer();
      expect(bufferForUri(file2)).toBe(file2Buffer);
    });
  });

  it('should throw an error if remote connection not found', () => {
    const uri = 'nuclide://host:1234/abc.txt';
    expect(() => bufferForUri(uri))
      .toThrow(`ServerConnection cannot be found for uri: ${uri}`);
  });
});
