'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {ServerStatusUpdate} from '../../nuclide-flow-base';

import {Observable} from '@reactivex/rxjs';

import typeof * as FlowServiceFactoryType from '../lib/FlowServiceFactory';

import {uncachedRequire} from '../../nuclide-test-helpers';

describe('FlowServiceFactory', () => {
  let FlowServiceFactory: FlowServiceFactoryType = (null: any);
  let getServiceByNuclideUriSpy: JasmineSpy = (null: any);
  let serverUpdates: Array<ServerStatusUpdate> = (null: any);
  let fakeFlowService: Object = (null: any);

  beforeEach(() => {
    serverUpdates = [];
    fakeFlowService = {
      getServerStatusUpdates() { return Observable.from(serverUpdates); },
    };
    getServiceByNuclideUriSpy =
      spyOn(require('../../nuclide-client'), 'getServiceByNuclideUri')
      .andCallFake(() => fakeFlowService);
    FlowServiceFactory = (uncachedRequire(require, '../lib/FlowServiceFactory'): any);
  });

  afterEach(() => {
    jasmine.unspy(require('../../nuclide-client'), 'getServiceByNuclideUri');
  });

  describe('getFlowServiceByNuclideUri', () => {
    it('should call getFlowServiceByNuclideUri with the filename', () => {
      FlowServiceFactory.getFlowServiceByNuclideUri('fake/path');
      expect(getServiceByNuclideUriSpy).toHaveBeenCalledWith('FlowService', 'fake/path');
    });
  });

  describe('getLocalFlowService', () => {
    it('should call getFlowServiceByNuclideUri with null', () => {
      FlowServiceFactory.getLocalFlowService();
      expect(getServiceByNuclideUriSpy).toHaveBeenCalledWith('FlowService', null);
    });
  });

  describe('getServerStatusUpdates', () => {
    beforeEach(() => {
      serverUpdates = [
        {
          pathToRoot: 'foo',
          status: 'unknown',
        },
        {
          pathToRoot: 'foo',
          status: 'failed',
        },
      ];
    });

    it('relays the server status updates', () => {
      waitsForPromise(async () => {
        const updatesPromise = FlowServiceFactory
          .getServerStatusUpdates()
          .take(2)
          .toArray()
          .toPromise();
        FlowServiceFactory.getLocalFlowService();
        expect(await updatesPromise).toEqual(serverUpdates);
      });
    });
  });

  describe('getCurrentServiceInstances', () => {
    it('returns a set with the current service instances', () => {
      expect(FlowServiceFactory.getCurrentServiceInstances().size).toEqual(0);

      FlowServiceFactory.getLocalFlowService();

      const instances = FlowServiceFactory.getCurrentServiceInstances();
      expect(instances.size).toEqual(1);
      expect(instances.has(fakeFlowService)).toBeTruthy();
    });
  });
});
