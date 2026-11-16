import { SearchFilters, SearchFiltersProps } from "./SearchFilters";

export type TipoPesquisaFornecedor = "ID" | "NOME" | "CNPJ" | "EMAIL";

export function SuppliersFilters(p: SearchFiltersProps<TipoPesquisaFornecedor>) {
  const placeholder = {
    ID: "Digite o ID do fornecedor...",
    NOME: "Digite o nome ou razão social...",
    CNPJ: "Digite o CNPJ...",
    EMAIL: "Digite o e-mail...",
  }[p.tipoPesquisa];

  return <SearchFilters {...p} testID="suppliers-filters"
    options={[["ID", "ID"], ["NOME", "Nome"], ["CNPJ", "CNPJ"], ["EMAIL", "E-mail"]]}
    placeholder={placeholder} keyboardType={p.tipoPesquisa === "ID" ? "numeric" : "default"}
    setTipoPesquisa={value => { p.setTipoPesquisa(value); p.setPesquisa(""); }} />;
}
