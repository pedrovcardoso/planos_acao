
Option Explicit

'================================================================================
' DECLARAÇÕES DA API DO WINDOWS - ESSENCIAL PARA ABRIR O NAVEGADOR
' ESTE BLOCO DEVE ESTAR NO TOPO ABSOLUTO DO MÓDULO
'================================================================================
#If VBA7 Then
    Private Declare PtrSafe Function ShellExecute Lib "shell32.dll" Alias "ShellExecuteA" ( _
        ByVal hwnd As LongPtr, _
        ByVal lpOperation As String, _
        ByVal lpFile As String, _
        ByVal lpParameters As String, _
        ByVal lpDirectory As String, _
        ByVal nShowCmd As Long) As LongPtr
#Else
    Private Declare Function ShellExecute Lib "shell32.dll" Alias "ShellExecuteA" ( _
        ByVal hwnd As Long, _
        ByVal lpOperation As String, _
        ByVal lpFile As String, _
        ByVal lpParameters As String, _
        ByVal lpDirectory As String, _
        ByVal nShowCmd As Long) As Long
#End If

' Constante para a ação de abrir o arquivo
Private Const SW_SHOWNORMAL As Long = 1


'================================================================================
' MACRO PRINCIPAL - Execute esta para gerar e abrir o gráfico
' ESTA SEÇÃO FOI MODIFICADA PARA BUSCAR A TABELA3 EM UMA ABA ESPECÍFICA
'================================================================================
Public Sub GerarGraficoGantt()
    Dim tblAcoes As ListObject
    Dim tblPlanos As ListObject
    Dim ws As Worksheet
    Dim jsonAcoesString As String
    Dim jsonPlanosString As String
    Dim htmlContent As String
    Dim tempFilePath As String
    
    ' Define a planilha ativa (para a Tabela1)
    Set ws = ThisWorkbook.ActiveSheet
    
    ' Encontrar a Tabela1 para Ações na planilha ATIVA
    On Error Resume Next
    Set tblAcoes = ws.ListObjects("Tabela1")
    On Error GoTo 0
    
    If tblAcoes Is Nothing Then
        MsgBox "A 'Tabela1' (para Ações) não foi encontrada na planilha ativa. Verifique o nome da tabela.", vbCritical, "Erro"
        Exit Sub
    End If
    
    ' *** MODIFICADO: Encontrar a Tabela3 na aba específica "Planos de ação" ***
    On Error Resume Next
    ' Aponta diretamente para a planilha "Planos de ação" para encontrar a Tabela3
    Set tblPlanos = ThisWorkbook.Worksheets("Planos de ação").ListObjects("Tabela3")
    On Error GoTo 0
    
    If tblPlanos Is Nothing Then
        MsgBox "A 'Tabela3' não foi encontrada na planilha 'Planos de ação'. Verifique o nome da aba e da tabela.", vbCritical, "Erro"
        Exit Sub
    End If
    
    ' 1. Converte os dados de ambas as tabelas para strings JSON
    jsonAcoesString = TabelaParaJson(tblAcoes)
    jsonPlanosString = TabelaParaJson(tblPlanos)
    
    If Len(jsonAcoesString) = 0 Or Len(jsonPlanosString) = 0 Then
        MsgBox "Não foi possível gerar o JSON para uma ou ambas as tabelas. Verifique se as tabelas contêm dados.", vbExclamation, "Aviso"
        Exit Sub
    End If
    
    ' 2. Obtém o template HTML da planilha oculta
    htmlContent = ObterTemplateHtml()
    If htmlContent = "" Then Exit Sub
    
    ' 3. Substitui AMBOS os placeholders no HTML pelos JSONs gerados
    htmlContent = Replace(htmlContent, "'##JSON_ACOES_PLACEHOLDER##'", jsonAcoesString)
    htmlContent = Replace(htmlContent, "'##JSON_PLANOS_PLACEHOLDER##'", jsonPlanosString)
    
    ' 4. Salva o HTML em um arquivo temporário
    tempFilePath = Environ("TEMP") & "\GanttChart_" & Format(Now, "yyyymmdd_hhmmss") & ".html"
    If Not SalvarTextoEmArquivo(htmlContent, tempFilePath) Then
        MsgBox "Ocorreu um erro ao tentar salvar o arquivo HTML temporário.", vbCritical, "Erro de Arquivo"
        Exit Sub
    End If
    
    ' 5. Abre o arquivo HTML no navegador padrão
    ShellExecute 0, "open", tempFilePath, "", "", SW_SHOWNORMAL
    
    MsgBox "Gráfico de Gantt gerado e aberto no navegador!", vbInformation, "Sucesso"
End Sub


'================================================================================
' FUNÇÃO AUXILIAR: Converte um objeto Tabela (ListObject) para uma string JSON
' NENHUMA ALTERAÇÃO NECESSÁRIA AQUI.
'================================================================================
Private Function TabelaParaJson(ByVal tbl As ListObject) As String
    Dim dataRange As Range
    Dim headerRange As Range
    Dim r As Long, c As Long
    Dim jsonArray As String
    Dim jsonObject As String
    Dim cellValue As Variant
    Dim headerName As String
    
    Set dataRange = tbl.DataBodyRange
    Set headerRange = tbl.HeaderRowRange
    
    If dataRange Is Nothing Then Exit Function
    
    jsonArray = "["
    
    For r = 1 To dataRange.Rows.Count
        jsonObject = "{"
        For c = 1 To dataRange.Columns.Count
            headerName = CStr(headerRange.Cells(1, c).Value)
            cellValue = dataRange.Cells(r, c).Value
            
            jsonObject = jsonObject & Chr(34) & headerName & Chr(34) & ":"
            
            Select Case LCase(headerName)
                Case "número da atividade"
                    If IsNumeric(cellValue) Then
                        jsonObject = jsonObject & CLng(cellValue)
                    Else
                        jsonObject = jsonObject & "null"
                    End If
                Case "data de início", "data fim", "data início"
                    If IsDate(cellValue) Then
                        jsonObject = jsonObject & Chr(34) & Format(cellValue, "yyyy-mm-dd") & Chr(34)
                    Else
                        jsonObject = jsonObject & "null"
                    End If
                Case Else
                    jsonObject = jsonObject & Chr(34) & JsonEscapeString(CStr(cellValue)) & Chr(34)
            End Select
            
            If c < dataRange.Columns.Count Then
                jsonObject = jsonObject & ","
            End If
        Next c
        
        jsonObject = jsonObject & "}"
        
        If r < dataRange.Rows.Count Then
            jsonObject = jsonObject & ","
        End If
        
        jsonArray = jsonArray & jsonObject
    Next r
    
    jsonArray = jsonArray & "]"
    TabelaParaJson = jsonArray
End Function


'================================================================================
' FUNÇÃO AUXILIAR: Salva uma string de texto em um arquivo
' NENHUMA ALTERAÇÃO NECESSÁRIA AQUI.
'================================================================================
Private Function SalvarTextoEmArquivo(ByVal content As String, ByVal filePath As String) As Boolean
    Dim fso As Object
    Dim fileStream As Object
    
    On Error GoTo ErroHandler
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set fileStream = fso.CreateTextFile(filePath, True, True)
    fileStream.Write content
    fileStream.Close
    
    SalvarTextoEmArquivo = True
    Exit Function

ErroHandler:
    SalvarTextoEmArquivo = False
End Function

'================================================================================
' FUNÇÃO AUXILIAR: Retorna o código HTML completo.
' NENHUMA ALTERAÇÃO NECESSÁRIA AQUI.
'================================================================================
Private Function ObterTemplateHtml() As String
    Dim html As String
    Dim js As String
    Dim css As String
    
    On Error GoTo ErroHandler
    
    html = ThisWorkbook.Worksheets("HTMLTemplate").Range("A2").Value
    js = ThisWorkbook.Worksheets("HTMLTemplate").Range("B2").Value
    css = ThisWorkbook.Worksheets("HTMLTemplate").Range("C2").Value

    If Len(html) = 0 Or Len(js) = 0 Or Len(css) = 0 Then
        MsgBox "Uma ou mais células (A2, B2, C2) na planilha 'HTMLTemplate' estão vazias.", vbCritical, "Erro de Template"
        ObterTemplateHtml = ""
        Exit Function
    End If

    html = Replace(html, "<link rel='stylesheet' href='styles.css'>", "<style>" & vbCrLf & css & vbCrLf & "</style>")
    html = Replace(html, "<script src='scripts.js'></script>", "<script>" & vbCrLf & js & vbCrLf & "</script>")

    ObterTemplateHtml = html
    Exit Function

ErroHandler:
    MsgBox "Não foi possível encontrar a planilha 'HTMLTemplate' ou ler seu conteúdo." & vbCrLf & _
           "Verifique se a planilha existe e se os códigos estão nas células A2, B2 e C2.", vbCritical, "Erro de Template"
    ObterTemplateHtml = ""
End Function

'================================================================================
' FUNÇÃO AUXILIAR: Escapa caracteres especiais de uma string para o formato JSON.
' NENHUMA ALTERAÇÃO NECESSÁRIA AQUI.
'================================================================================
Private Function JsonEscapeString(ByVal inputText As String) As String
    Dim temp As String
    temp = inputText
    
    temp = Replace(temp, "\", "\\")
    temp = Replace(temp, Chr(34), "\" & Chr(34))
    temp = Replace(temp, vbCrLf, "\n")
    temp = Replace(temp, vbLf, "\n")
    temp = Replace(temp, vbCr, "\r")
    temp = Replace(temp, vbTab, "\t")
    
    JsonEscapeString = temp
End Function

