'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

const {AtomInput} = require('../lib/AtomInput');
const {
  React,
  ReactDOM,
} = require('react-for-atom');

let reactElement;

function createWithProps(props: any) {
  const hostEl = document.createElement('div');
  return ReactDOM.render(<AtomInput {...props} />, hostEl);
}

describe('AtomInput', () => {

  afterEach(() => {
    if (reactElement) {
      ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(reactElement).parentNode);
    }
    reactElement = null;
  });

  it('honors the initialValue param', () => {
    reactElement = createWithProps({initialValue: 'some text'});
    expect(reactElement.getText()).toBe('some text');
    expect(reactElement.getTextEditor().getText()).toBe('some text');
  });

  it('focus() focuses the end of the line', () => {
    const initialValue = 'some text';
    reactElement = createWithProps({initialValue});
    expect(reactElement.getTextEditor().getCursorBufferPosition()).toEqual(
        [0, 0]);
    reactElement.focus();
    expect(reactElement.getTextEditor().getCursorBufferPosition()).toEqual(
        [0, initialValue.length]);
  });

  it('onDidChange() is fired when the text changes', () => {
    const initialValue = 'some text';
    reactElement = createWithProps({initialValue});
    const onDidChange = jasmine.createSpy('onDidChange');
    const disposable = reactElement.onDidChange(onDidChange);

    reactElement.setText('the new text');
    expect(onDidChange.calls.length).toBe(1);

    reactElement.setText('even more new text');
    expect(onDidChange.calls.length).toBe(2);

    disposable.dispose();
    reactElement.setText('the last update');
    expect(onDidChange.calls.length).toBe(2);
  });

  it('updates will stop firing when the component is unmounted', () => {
    const initialValue = 'some text';
    reactElement = createWithProps({initialValue});
    const onDidChange = jasmine.createSpy('onDidChange');
    reactElement.onDidChange(onDidChange);

    const textEditor = reactElement.getTextEditor();
    textEditor.setText('the new text');
    expect(onDidChange.calls.length).toBe(1);

    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(reactElement).parentNode);
    reactElement = null;

    textEditor.setText('even more new text');
    expect(onDidChange.calls.length).toBe(1);
  });

});
