import React from "react";
import { Text, View } from "react-native";
import { FilterChoices, filterStyles } from "./FilterPanel";
import { SearchFilters, SearchFiltersProps } from "./SearchFilters";
import { pagesStyles } from "./ScreensLayout";

type Status = "TODOS" | "P" | "E" | "C";
type Period = "TODOS" | "HOJE" | "7_DIAS" | "30_DIAS";
type Search = "PEDIDO" | "CLIENTE" | "MATERIAL";
type Props = SearchFiltersProps<Search> & {
  statusFiltro: Status; setStatusFiltro: React.Dispatch<React.SetStateAction<Status>>;
  periodoFiltro: Period; setPeriodoFiltro: React.Dispatch<React.SetStateAction<Period>>;
};

export function OrdersFilters(p: Props) {
  return <SearchFilters {...p} testID="orders-filters"
    options={[["PEDIDO", "Pedido"], ["CLIENTE", "Cliente"], ["MATERIAL", "Produto"]]}
    fieldLabel="Identificador" keyboardType="number-pad"
    placeholder={`ID do ${p.tipoPesquisa === "PEDIDO" ? "pedido" : p.tipoPesquisa === "CLIENTE" ? "cliente" : "produto"}`}
    additionalFiltersLabel="Status e período"
    additionalFilters={<>
      <View style={filterStyles.group}><Text style={pagesStyles.label}>Status</Text><FilterChoices<Status> items={[["TODOS", "Todos"], ["P", "Pendente"], ["E", "Entregue"], ["C", "Cancelado"]]} value={p.statusFiltro} onChange={p.setStatusFiltro} /></View>
      <View style={filterStyles.group}><Text style={pagesStyles.label}>Período</Text><FilterChoices<Period> items={[["TODOS", "Todo o período"], ["HOJE", "Hoje"], ["7_DIAS", "7 dias"], ["30_DIAS", "30 dias"]]} value={p.periodoFiltro} onChange={p.setPeriodoFiltro} /></View>
    </>} />;
}
