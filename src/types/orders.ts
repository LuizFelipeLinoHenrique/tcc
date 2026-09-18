export type Pedido = {
    id: number;
    data_pedido: string;
    status: "P" | "E" | "C";

    produto?: {
        id: number;
        nome: string;
        descricao?: string;
        valor: number;
        categoria?: string;
    };

    quantidade?: number;
    valor_total?: number;

    cliente?: {
        id: number;
        nome: string;
        email?: string;
        telefone?: string;
    };

    endereco?: {
        rua?: string;
        numero?: string;
        cidade?: string;
        estado?: string;
        cep?: string;
    };

    observacao?: string;
};