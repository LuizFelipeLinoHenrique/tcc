import { Colors } from "@/src/theme/colors";
// import { useEffect, useState } from "react";
// import {
//     ActivityIndicator,
//     StyleSheet,
//     Text,
//     TextInput,
//     View,
// } from "react-native";
// import { useLocalSearchParams } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";

// import { AnimatedButton } from "@/src/components/AnimatedButton";
// import { PagesLayout, pagesStyles } from "@/src/components/ScreensLayout";
// import { EditSupplierCard } from "@/src/components/SuppliersEdit";
// import useResponsive from "@/src/hooks/useResponsive";
// import { supabase } from "@/src/lib/supabase";

// export default function EditSupplier() {
//     const { maxCardWidth } = useResponsive();
//     const params = useLocalSearchParams<{ id?: string }>();

//     const [inputId, setInputId] = useState(params.id ?? "");
//     const [selectedId, setSelectedId] = useState<number | null>(
//         params.id ? Number(params.id) : null
//     );
//     const [erroBusca, setErroBusca] = useState<string | null>(null);
//     const [buscando, setBuscando] = useState(false);

//     useEffect(() => {
//         if (params.id) {
//             const num = Number(params.id);
//             if (!Number.isNaN(num) && num > 0) {
//                 setInputId(params.id);
//                 setSelectedId(num);
//             }
//         }
//     }, [params.id]);

//     async function buscarFornecedor() {
//         setErroBusca(null);
//         const num = Number(inputId.trim());

//         if (Number.isNaN(num) || num <= 0) {
//             setErroBusca("Informe um ID numérico válido para buscar o fornecedor.");
//             return;
//         }

//         setBuscando(true);

//         const { data, error } = await supabase
//             .from("fornecedores")
//             .select("id, nome")
//             .eq("id", num)
//             .maybeSingle();

//         setBuscando(false);

//         if (error) {
//             console.error("Erro ao verificar fornecedor:", error);
//             setErroBusca("Não foi possível consultar o fornecedor. Verifique a conexão.");
//             return;
//         }

//         if (!data) {
//             setErroBusca(`Nenhum fornecedor encontrado com o ID #${num}.`);
//             return;
//         }

//         setSelectedId(data.id);
//     }

//     return (
//         <PagesLayout scroll={true} scrollContent={{ paddingVertical: 20 }}>
//             <View style={styles.container}>
//                 {selectedId ? (
//                     <View style={{ width: "100%", alignItems: "center", gap: 14 }}>
//                         {/* Botão para trocar de fornecedor se desejar */}
//                         <View style={{ width: "100%", maxWidth: maxCardWidth, alignItems: "flex-end" }}>
//                             <AnimatedButton
//                                 title={
//                                     <View style={styles.switchButtonContent}>
//                                         <Ionicons name="search-outline" size={16} color={Colors.hex0B4F6C} />
//                                         <Text style={styles.switchButtonText}>Editar outro fornecedor</Text>
//                                     </View>
//                                 }
//                                 stylesPressable={styles.switchButton}
//                                 onPress={() => {
//                                     setSelectedId(null);
//                                     setInputId("");
//                                     setErroBusca(null);
//                                 }}
//                             />
//                         </View>

//                         <EditSupplierCard
//                             idFornecedor={selectedId}
//                             onSaveSuccess={() => {
//                                 // Fornecedor salvo com sucesso
//                             }}
//                         />
//                     </View>
//                 ) : (
//                     <View style={[pagesStyles.card, { maxWidth: maxCardWidth }]}>
//                         {/* CABEÇALHO */}
//                         <View style={styles.header}>
//                             <View style={styles.headerIcon}>
//                                 <Ionicons name="create" size={24} color={Colors.hex0B4F6C} />
//                             </View>
//                             <View style={styles.headerTextContainer}>
//                                 <Text style={pagesStyles.brand}>GESTÃO DE FORNECEDORES</Text>
//                                 <Text style={[pagesStyles.title, styles.titleText]}>
//                                     Editar Fornecedor
//                                 </Text>
//                                 <Text style={pagesStyles.description}>
//                                     Localize o fornecedor que deseja atualizar informando seu código identificador (ID)
//                                 </Text>
//                             </View>
//                         </View>

//                         <View style={styles.divider} />

//                         <View style={styles.searchSection}>
//                             <View style={pagesStyles.field}>
//                                 <Text style={pagesStyles.label}>ID DO FORNECEDOR</Text>
//                                 <View style={styles.inputWrapper}>
//                                     <Ionicons
//                                         name="finger-print-outline"
//                                         size={18}
//                                         color={Colors.hex64748B}
//                                         style={styles.inputIcon}
//                                     />
//                                     <TextInput
//                                         value={inputId}
//                                         onChangeText={(val) => {
//                                             setInputId(val.replace(/\D/g, ""));
//                                             setErroBusca(null);
//                                         }}
//                                         placeholder="Ex: 1"
//                                         placeholderTextColor={Colors.hex94A3B8}
//                                         keyboardType="numeric"
//                                         returnKeyType="search"
//                                         onSubmitEditing={buscarFornecedor}
//                                         editable={!buscando}
//                                         style={styles.input}
//                                     />
//                                 </View>
//                             </View>

//                             {erroBusca ? (
//                                 <View style={styles.errorBox}>
//                                     <Ionicons name="alert-circle" size={18} color={Colors.hexB91C1C} />
//                                     <Text style={styles.errorBoxText}>{erroBusca}</Text>
//                                 </View>
//                             ) : null}

//                             <AnimatedButton
//                                 stylesPressable={[
//                                     pagesStyles.primaryButton,
//                                     !inputId.trim() && styles.buttonDisabled,
//                                 ]}
//                                 stylesText={pagesStyles.primaryButtonText}
//                                 onPress={buscarFornecedor}
//                                 disabled={!inputId.trim() || buscando}
//                                 title={
//                                     buscando ? (
//                                         <ActivityIndicator size="small" color={Colors.hexFFFDF9} />
//                                     ) : (
//                                         "Carregar Fornecedor"
//                                     )
//                                 }
//                             />
//                         </View>
//                     </View>
//                 )}
//             </View>
//         </PagesLayout>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         width: "100%",
//         alignItems: "center",
//         paddingHorizontal: 10,
//     },
//     header: {
//         flexDirection: "row",
//         alignItems: "flex-start",
//         gap: 14,
//     },
//     headerIcon: {
//         width: 48,
//         height: 48,
//         borderRadius: 12,
//         backgroundColor: Colors.hexE8F1F5,
//         alignItems: "center",
//         justifyContent: "center",
//         marginTop: 2,
//     },
//     headerTextContainer: {
//         flex: 1,
//     },
//     titleText: {
//         marginVertical: 2,
//         marginBottom: 2,
//     },
//     divider: {
//         height: 1,
//         backgroundColor: Colors.hexDDE8EF,
//         marginVertical: 20,
//     },
//     searchSection: {
//         gap: 18,
//     },
//     inputWrapper: {
//         flexDirection: "row",
//         alignItems: "center",
//         backgroundColor: Colors.hexF8FAFC,
//         borderWidth: 1,
//         borderColor: Colors.hexCFDDE6,
//         borderRadius: 12,
//         paddingHorizontal: 12,
//     },
//     inputIcon: {
//         marginRight: 8,
//     },
//     input: {
//         flex: 1,
//         minHeight: 46,
//         fontSize: 15,
//         fontFamily: "WorksansRegular",
//         color: Colors.hex0F172A,
//     },
//     errorBox: {
//         flexDirection: "row",
//         alignItems: "center",
//         gap: 8,
//         backgroundColor: Colors.hexFEF2F2,
//         borderWidth: 1,
//         borderColor: Colors.hexFECACA,
//         paddingHorizontal: 12,
//         paddingVertical: 10,
//         borderRadius: 10,
//     },
//     errorBoxText: {
//         fontSize: 13,
//         fontFamily: "WorksansMedium",
//         color: Colors.hexB91C1C,
//         flex: 1,
//     },
//     buttonDisabled: {
//         opacity: 0.5,
//     },
//     switchButton: {
//         backgroundColor: Colors.hexF8FAFC,
//         borderWidth: 1,
//         borderColor: Colors.hexCFDDE6,
//         paddingHorizontal: 14,
//         paddingVertical: 8,
//         borderRadius: 10,
//     },
//     switchButtonContent: {
//         flexDirection: "row",
//         alignItems: "center",
//         gap: 6,
//     },
//     switchButtonText: {
//         fontSize: 13,
//         fontFamily: "WorksansSemiBold",
//         color: Colors.hex0B4F6C,
//     },
// });
