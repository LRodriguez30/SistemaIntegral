interface HumanizeConnector {
    index: number;
    word: string;
}

interface HumanizeConfig {
    value: string;
    connectors?: HumanizeConnector[];
}

export function humanizeEnum({
    value,
    connectors
}: HumanizeConfig): string {

    const words = value
        .toLowerCase()
        .split('_');

    const result: string[] = [];

    for (let i = 0; i < words.length; i++) {

        const word = words[i];

        result.push(
            word.charAt(0).toUpperCase() +
            word.slice(1)
        );

        const connector =
            connectors?.find(c => c.index === i);

        if (connector) {
            result.push(connector.word);
        }
    }

    return result.join(' ');
}