import { SearchFilters, SearchFiltersProps } from "./SearchFilters";

export type TipoPesquisaMaterial = "ID" | "NOME" | "DESCRICAO";

export function MaterialsFilters(p: SearchFiltersProps<TipoPesquisaMaterial>) {
  const placeholder = {
    ID: "Digite o ID do produto...",
    NOME: "Digite o nome do produto...",
    DESCRICAO: "Digite a descrição do produto...",
  }[p.tipoPesquisa];

  return <SearchFilters {...p} testID="materials-filters"
    options={[["ID", "ID"], ["NOME", "Nome"], ["DESCRICAO", "Descrição"]]}
    placeholder={placeholder} keyboardType={p.tipoPesquisa === "ID" ? "numeric" : "default"}
    setTipoPesquisa={value => { p.setTipoPesquisa(value); p.setPesquisa(""); }} />;
}
