import { SearchFilters, SearchFiltersProps } from "./SearchFilters";

export type TipoPesquisaCliente = "ID" | "NOME" | "EMAIL" | "TELEFONE";

export function ClientsFilters(p: SearchFiltersProps<TipoPesquisaCliente>) {
  const placeholder = {
    ID: "Digite o ID do cliente...",
    NOME: "Digite o nome do cliente...",
    EMAIL: "Digite o e-mail do cliente...",
    TELEFONE: "Digite o telefone do cliente...",
  }[p.tipoPesquisa];

  return <SearchFilters {...p} testID="clients-filters"
    options={[["ID", "ID"], ["NOME", "Nome"], ["EMAIL", "E-mail"], ["TELEFONE", "Telefone"]]}
    placeholder={placeholder} keyboardType={p.tipoPesquisa === "ID" ? "numeric" : "default"}
    setTipoPesquisa={value => { p.setTipoPesquisa(value); p.setPesquisa(""); }} />;
}
