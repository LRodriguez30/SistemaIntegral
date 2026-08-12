export function isValidGuid(value: any): boolean {
    if (typeof value !== 'string') return false;

    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
        .test(value.trim());
}