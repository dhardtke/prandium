import { Oak } from "../../deps-oak.ts";
import { AppState } from "../../src/http/webserver.ts";

export class MockContextBuilder {
  private readonly _request: Oak.Request;
  private readonly _response: Oak.Response;
  private readonly _ctx: Oak.Context<AppState>;

  //private readonly _renderCalls: [Template<unknown>, unknown][] = [];

  constructor() {
    this._request = {} as Oak.Request;
    this._response = {
      status: -1,
    } as unknown as Oak.Response;
    this._ctx = {
      request: this._request,
      response: this._response,
    } as Oak.Context<AppState>;

    this._initializeRender();
  }

  private _initializeRender() {
    // this._ctx.render = <Data>(tpl: Template<Data>, data: Data) => {
    //   this._renderCalls.push([tpl, data]);
    // };
  }

  public get ctx(): Oak.Context<AppState> {
    return this._ctx;
  }

  // public get renderCalls(): [Template<unknown>, unknown][] {
  //   return this._renderCalls;
  // }
}
