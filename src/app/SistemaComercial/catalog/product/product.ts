export class ProductModel implements IProduct {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    tags: string[];
    colors: IProductColor[];

    category: string;
    available: boolean;

    model: string;

    constructor(
        id: number,
        model: string,
        options?: Partial<IProduct>
    ) {
        this.id = id;
        this.model = model;

        this.name = options?.name ?? "Pasos";
        this.description = options?.description ?? "Estilo minimalista y suave al caminar, ideal para uso diario dentro y fuera de casa.";
        this.price = options?.price ?? 220;
        this.image = options?.image ?? "Not Found.png";
        this.tags = options?.tags ?? ["Comodidad", "Originalidad"];
        this.colors = options?.colors ?? [];

        this.category = options?.category ?? "Chinelas";
        this.available = options?.available ?? true;
    }
}


interface IProduct {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    tags: string[];
    colors: IProductColor[];
    category: string;
    available: boolean;
}

interface IProductColor {
    name: string;
    hex: string;
    secondaryHex?: string;
    thirdHex?: string;
}