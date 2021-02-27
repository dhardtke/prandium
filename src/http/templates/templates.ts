import {Eta} from "../../deps.ts";

Eta.configure({
    useWith: true,
    views: "http/templates"
});

class Template<Data = void> {
    private readonly filename: string;
    private source?: string;

    constructor(filename: string) {
        this.filename = filename;
    }

    private async updateSource(): Promise<string> {
        if (this.source == null) {
            this.source = await Deno.readTextFile(this.filename);
        }
        return this.source;
    }

    public async render(data: Data): Promise<string> {
        const globals = {
            i18n: function (key: string): string {
                // TODO impl
                // TODO move out of this scope for testing
                return "Hello " + key;
            }
        };
        const args = {...data, ...globals};
        return this.updateSource().then((s) => Eta.render(s, args)) as Promise<string>;
    }
}

export const IndexTemplate = new Template<{ favoriteCake: string }>("http/templates/index.html");
