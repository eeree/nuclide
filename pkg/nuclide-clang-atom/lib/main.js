'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {HyperclickProvider} from '../../hyperclick';
import type {TypeHintProvider as TypeHintProviderType} from '../../nuclide-type-hint-interfaces';
import type {
  BusySignalProviderBase as BusySignalProviderBaseType,
} from '../../nuclide-busy-signal';
import type {DiagnosticProvider} from '../../nuclide-diagnostics-base';
import type {CodeFormatProvider} from '../../nuclide-code-format/lib/types';
import type ClangDiagnosticsProvider from './ClangDiagnosticsProvider';

import {CompositeDisposable} from 'atom';
import {GRAMMAR_SET, PACKAGE_NAME} from './constants';

let busySignalProvider: ?BusySignalProviderBaseType = null;
let diagnosticProvider: ?ClangDiagnosticsProvider = null;
let subscriptions: ?CompositeDisposable = null;

function getBusySignalProvider(): BusySignalProviderBaseType {
  if (!busySignalProvider) {
    const {BusySignalProviderBase} = require('../../nuclide-busy-signal');
    busySignalProvider = new BusySignalProviderBase();
  }
  return busySignalProvider;
}

function getDiagnosticsProvider(): ClangDiagnosticsProvider {
  if (!diagnosticProvider) {
    const provider = require('./ClangDiagnosticsProvider');
    diagnosticProvider = new provider(getBusySignalProvider());
  }
  return diagnosticProvider;
}

export function activate() {
  subscriptions = new CompositeDisposable();
  // Provide a 'Clean and rebuild' command to restart the Clang server for the current file
  // and reset all compilation flags. Useful when BUCK targets or headers change,
  // since those are heavily cached for performance. Also great for testing!
  subscriptions.add(
    atom.commands.add('atom-workspace', 'nuclide-clang:clean-and-rebuild', async () => {
      const editor = atom.workspace.getActiveTextEditor();
      if (editor == null) {
        return;
      }
      const path = editor.getPath();
      if (path == null) {
        return;
      }
      const {reset} = require('./libclang');
      await reset(editor);
      if (diagnosticProvider != null) {
        diagnosticProvider.invalidateBuffer(editor.getBuffer());
        diagnosticProvider.runDiagnostics(editor);
      }
    }),
  );
}

/** Provider for autocomplete service. */
export function createAutocompleteProvider(): atom$AutocompleteProvider {
  const {AutocompleteProvider} = require('./AutocompleteProvider');
  const autocompleteProvider = new AutocompleteProvider();
  const getSuggestions = autocompleteProvider.getAutocompleteSuggestions
    .bind(autocompleteProvider);

  return {
    selector: '.source.objc, .source.objcpp, .source.cpp, .source.c',
    inclusionPriority: 1,
    suggestionPriority: 5,  // Higher than the snippets provider.
    getSuggestions,
  };
}

export function createTypeHintProvider(): TypeHintProviderType {
  const {TypeHintProvider} = require('./TypeHintProvider');
  const typeHintProvider = new TypeHintProvider();
  const typeHint = typeHintProvider.typeHint.bind(typeHintProvider);

  return {
    inclusionPriority: 1,
    providerName: PACKAGE_NAME,
    selector: Array.from(GRAMMAR_SET).join(', '),
    typeHint,
  };
}

export function getHyperclickProvider(): HyperclickProvider {
  return require('./HyperclickProvider');
}

export function provideBusySignal(): BusySignalProviderBaseType {
  return getBusySignalProvider();
}

export function provideCodeFormat(): CodeFormatProvider {
  return require('./CodeFormatProvider');
}

export function provideDiagnostics(): DiagnosticProvider {
  return getDiagnosticsProvider();
}

export function deactivate() {
  if (diagnosticProvider != null) {
    diagnosticProvider.dispose();
    diagnosticProvider = null;
  }
  if (subscriptions != null) {
    subscriptions.dispose();
    subscriptions = null;
  }
}
