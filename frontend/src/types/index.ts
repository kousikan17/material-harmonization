export type RoleName = "ADMIN" | "MATERIAL_EXPERT" | "REVIEWER" | "VIEWER";

export interface Role {
  id: string;
  name: RoleName;
  description?: string | null;
}

export interface CognateGroup {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface AdministrativeMinistry {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface Sector {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  cognate_groups: CognateGroup[];
}

export interface CPSEBrief {
  id: string;
  code: string;
  name: string;
}

export interface CPSE extends CPSEBrief {
  cognate_group_id?: string | null;
  administrative_ministry_id?: string | null;
  administrative_ministry?: string | null;
  sector_name?: string | null;
  cognate_group_name?: string | null;
  description?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  last_sync_at?: string | null;
  synchronization_status: string;
  created_at: string;
}

export interface CPSEStats extends CPSE {
  total_materials: number;
  active_materials: number;
  inactive_materials: number;
  new_materials: number;
  common_materials: number;
  unique_materials: number;
  duplicates: number;
  near_duplicates: number;
  functional_equivalents: number;
  pending_mappings: number;
  approved_mappings: number;
  legacy_codes: number;
  material_database_available: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: Role;
  cpse?: CPSEBrief | null;
  created_at: string;
}

export interface CommonMaterialBrief {
  id: string;
  common_code: string;
  standardized_description: string;
  status: string;
}

export interface MaterialAttribute {
  id: string;
  attr_key: string;
  attr_value: string;
}

export interface CPSEMaterial {
  id: string;
  original_material_code: string;
  original_description: string;
  normalized_description?: string | null;
  material_type?: string | null;
  material_grade?: string | null;
  dimensions?: string | null;
  technical_specification?: string | null;
  normalized_specification?: string | null;
  uom: string;
  normalized_uom?: string | null;
  manufacturer?: string | null;
  standard?: string | null;
  function?: string | null;
  classification?: string | null;
  classification_path?: string[] | null;
  packaging?: string | null;
  criticality: string;
  quantity?: number | null;
  annual_demand_quantity?: number | null;
  current_stock_quantity?: number | null;
  required_quantity?: number | null;
  unit_price?: number | null;
  currency?: string | null;
  is_active: boolean;
  status: string;
  cpse: CPSEBrief;
  source_created_at?: string | null;
  source_updated_at?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CPSEMaterialDetail extends CPSEMaterial {
  attributes: MaterialAttribute[];
  has_embedding: boolean;
  active_common_material?: CommonMaterialBrief | null;
}

export interface MaterialListResponse {
  items: CPSEMaterial[];
  total: number;
  page: number;
  page_size: number;
}

export interface CandidateScore {
  material: CPSEMaterial;
  final_score: number;
  description_score: number;
  specification_score: number;
  classification_score: number;
  uom_score: number;
  attribute_score: number;
  grade_score: number;
  dimension_score: number;
  standard_score: number;
  manufacturer_score: number;
  function_score: number;
  criticality_score: number;
}

export type MatchDecision =
  | "IDENTICAL"
  | "DUPLICATE"
  | "NEAR_DUPLICATE"
  | "FUNCTIONALLY_EQUIVALENT"
  | "NOT_EQUIVALENT"
  | "TECHNICAL_CONFLICT"
  | "MANUAL_REVIEW";

export interface AIAnalysis {
  id: string;
  material_id: string;
  final_score: number;
  description_score: number;
  specification_score: number;
  classification_score: number;
  uom_score: number;
  attribute_score: number;
  grade_score: number;
  dimension_score: number;
  standard_score: number;
  manufacturer_score: number;
  function_score: number;
  criticality_score: number;
  ml_probability?: number | null;
  ml_status?: string | null;
  decision: MatchDecision;
  reason_text?: string | null;
  recommended_common_code?: string | null;
  status: string;
  failure_reason?: string | null;
  technical_conflict: boolean;
  conflict_reason?: string | null;
  best_candidate?: CPSEMaterial | null;
  created_at: string;
}

export interface CommonMaterial {
  id: string;
  common_code: string;
  standardized_description: string;
  standardized_specification?: string | null;
  material_type: string;
  material_grade?: string | null;
  dimensions?: string | null;
  standardized_uom: string;
  standard?: string | null;
  function?: string | null;
  criticality: string;
  classification: string;
  classification_path?: string[] | null;
  status: string;
  confidence?: number | null;
  created_at: string;
}

export interface CommonMaterialDetail extends CommonMaterial {
  mapped_materials: CPSEMaterial[];
  mapped_cpses: string[];
}

export type MappingType =
  | "IDENTICAL"
  | "DUPLICATE"
  | "NEAR_DUPLICATE"
  | "FUNCTIONALLY_EQUIVALENT"
  | "MANUAL_MAPPING"
  | "LEGACY_MAPPING";

export type MappingDecisionStatus =
  | "AI_RECOMMENDED"
  | "PENDING_VALIDATION"
  | "APPROVED"
  | "REJECTED"
  | "EDITED_AND_APPROVED"
  | "TECHNICAL_CONFLICT"
  | "MANUAL_REVIEW";

export interface Mapping {
  id: string;
  common_material: CommonMaterial;
  cpse_material: CPSEMaterial;
  matched_against?: CPSEMaterial | null;
  mapping_type: MappingType;
  decision_status: MappingDecisionStatus;
  confidence_score?: number | null;
  evidence?: Record<string, { specified: boolean; match: boolean; score: number }> | null;
  reason?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalAction {
  id: string;
  action: string;
  actor_name: string;
  remarks?: string | null;
  created_at: string;
}

export interface ApprovalDetail extends Mapping {
  actions: ApprovalAction[];
}

export interface DuplicatePairItem {
  mapping_id: string;
  common_material: CommonMaterial;
  source_material: CPSEMaterial;
  matched_material: CPSEMaterial;
  mapping_type: MappingType;
  decision_status: MappingDecisionStatus;
  confidence_score?: number | null;
}

export interface DuplicateListResponse {
  items: DuplicatePairItem[];
  total: number;
  page: number;
  page_size: number;
  total_duplicates: number;
  pending_validation: number;
  approved: number;
  common_materials_generated: number;
}

export interface DuplicatePairDetail {
  mapping_id: string;
  common_material: CommonMaterial;
  source_material: CPSEMaterial;
  matched_material: CPSEMaterial;
  mapping_type: MappingType;
  decision_status: MappingDecisionStatus;
  confidence_score?: number | null;
  breakdown?: Record<string, number> | null;
  sbert_similarity?: number | null;
  ml_probability?: number | null;
  ml_status?: string | null;
}

export interface AuditLog {
  id: string;
  actor_type: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  reason?: string | null;
  ai_model_version?: string | null;
  confidence?: number | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  created_at: string;
}

export interface DashboardStatistics {
  cpses_connected: number;
  total_sectors: number;
  total_materials: number;
  common_material_codes: number;
  duplicates_identified: number;
  near_duplicates: number;
  functionally_equivalent: number;
  pending_validation: number;
  legacy_codes_rationalized: number;
  potential_procurement_aggregation_value: number;
  technical_conflicts: number;
  new_materials_today: number;
  last_synchronization?: string | null;
  todays_imports: {
    cpse_name: string;
    sector?: string | null;
    upload_time: string;
    total_records: number;
    status: string;
  }[];
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface DashboardTrends {
  materials_by_cpse: ChartPoint[];
  duplicate_reduction: ChartPoint[];
  common_code_adoption: ChartPoint[];
  harmonization_progress: ChartPoint[];
  cpse_contribution: ChartPoint[];
  procurement_aggregation_opportunities: ChartPoint[];
}

export interface SystemSettings {
  threshold_auto: number;
  threshold_review: number;
  threshold_low: number;
  weight_description: number;
  weight_specification: number;
  weight_classification: number;
  weight_uom: number;
  weight_attributes: number;
  weight_grade: number;
  weight_dimension: number;
  weight_standard: number;
  weight_manufacturer: number;
  weight_function: number;
  weight_criticality: number;
}

export interface DuplicateCodeGroup {
  original_material_code: string;
  cpses: string[];
  materials_count: number;
}

export interface DuplicateCodeListResponse {
  items: DuplicateCodeGroup[];
  total: number;
  total_duplicate_codes: number;
  cpses_affected: number;
  materials_affected: number;
}

export interface DuplicateCodeMaterial {
  id: string;
  original_material_code: string;
  original_description: string;
  technical_specification?: string | null;
  classification?: string | null;
  uom: string;
  manufacturer?: string | null;
  material_type?: string | null;
  status: string;
  cpse: CPSEBrief;
  attributes: MaterialAttribute[];
  updated_at: string;
}

export type DuplicateCodeClassification = "SAME_SOURCE_CODE" | "AI_TECHNICAL_EQUIVALENCE" | "TECHNICAL_CONFLICT";

export interface DuplicateCodePair {
  material_a_id: string;
  material_b_id: string;
  classification: DuplicateCodeClassification;
}

export interface DuplicateCodeCompare {
  original_material_code: string;
  materials: DuplicateCodeMaterial[];
  pairs: DuplicateCodePair[];
}

export type DatabaseType = "POSTGRESQL" | "MYSQL" | "ORACLE" | "SQLSERVER";

export interface SourceConnection {
  id: string;
  cpse: CPSEBrief;
  connection_name: string;
  database_type: DatabaseType;
  host: string;
  port: number;
  database_name: string;
  username_reference: string;
  secret_reference: string;
  ssl_enabled: boolean;
  read_only: boolean;
  table_name: string;
  column_mapping: Record<string, string>;
  cursor_column?: string | null;
  enabled: boolean;
  sync_interval_seconds: number;
  last_sync_started_at?: string | null;
  last_successful_sync?: string | null;
  last_sync_status?: string | null;
  last_error?: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncHistoryEntry {
  id: string;
  source_connection_id: string;
  sync_type: "FULL" | "INCREMENTAL";
  started_at: string;
  completed_at?: string | null;
  status: string;
  records_discovered: number;
  records_inserted: number;
  records_updated: number;
  records_skipped: number;
  records_failed: number;
  last_successful_cursor?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface SyncHistoryListResponse {
  items: SyncHistoryEntry[];
  total: number;
}

export interface TestConnectionResult {
  connected: boolean;
  database_version?: string | null;
  latency_ms?: number | null;
  error?: string | null;
  checked_at: string;
}

export interface SyncTriggerResponse {
  mode: "QUEUED" | "PROCESSED_INLINE";
  task_id?: string | null;
  batch?: SyncHistoryEntry | null;
}

// DEMO ONLY - see pages/DemoDataImport.tsx. Production material data is
// synchronized automatically through SourceConnection above, never CSV.
export interface CsvRowIssue {
  row_number: number;
  errors: string[];
  cpse_code?: string | null;
  original_material_code?: string | null;
}

export interface CpseDistributionItem {
  cpse_code: string;
  cpse_name: string;
  sector_name?: string | null;
  cognate_group_name?: string | null;
  material_count: number;
}

export interface CsvValidationResponse {
  filename: string;
  total_rows: number;
  valid_count: number;
  invalid_count: number;
  is_importable: boolean;
  file_errors: string[];
  invalid_rows: CsvRowIssue[];
  preview: Record<string, string>[];
  normalizations?: Record<string, string>;
  distribution?: CpseDistributionItem[];
}

export interface CsvImportRowResult {
  row_number: number;
  cpse_code: string;
  original_material_code: string;
  outcome: "created" | "updated" | "skipped" | "failed";
  common_material_code?: string | null;
  mapping_type?: string | null;
  decision_status?: string | null;
}

export interface CsvImportResponse {
  batch_id: string;
  filename: string;
  total_rows: number;
  valid_count: number;
  invalid_count: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  invalid_rows: CsvRowIssue[];
  results: CsvImportRowResult[];
}

export interface CsvImportHistoryItem {
  batch_id: string;
  filename: string;
  filenames?: string[];
  cpse_codes?: string[];
  file_count?: number;
  imported_at: string;
  actor_name: string;
  total_rows: number;
  valid_count: number;
  invalid_count: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface CsvImportHistoryResponse {
  items: CsvImportHistoryItem[];
  total: number;
}

export interface CPSEDemand {
  cpse_code: string;
  cpse_name: string;
  total_quantity: number;
  uom?: string | null;
}

export interface CollaborativeProcurementOpportunity {
  common_code: string;
  standardized_description: string;
  cpse_demand: CPSEDemand[];
  total_potential_aggregated_demand: number;
  uom?: string | null;
  includes_demo_data: boolean;
  note: string;
}


export interface ProcurementRecord {
  id: string;
  cpse_material_id: string;
  procurement_reference?: string | null;
  purchase_date?: string | null;
  quantity: number;
  uom?: string | null;
  unit_price?: number | null;
  currency: string;
  vendor?: string | null;
  plant_location?: string | null;
  is_demo_data: boolean;
  created_at: string;
}

export interface ManualMaterialEntry {
  cpse_code: string;
  original_material_code: string;
  original_description: string;
  material_type: string;
  material_grade?: string | null;
  dimensions?: string | null;
  technical_specification?: string | null;
  uom: string;
  manufacturer?: string | null;
  standard?: string | null;
  function?: string | null;
  classification?: string | null;
  packaging?: string | null;
  criticality?: string | null;
  quantity?: string | null;
  annual_demand_quantity?: string | null;
  current_stock_quantity?: string | null;
  required_quantity?: string | null;
  unit_price?: string | null;
  currency?: string | null;
}

export interface ManualMaterialBatch {
  entries: ManualMaterialEntry[];
  cpse_id?: string | null;
  group_id?: string | null;
}

export interface DataReadinessDashboard {
  total_materials: number;
  average_readiness_score: number;
  materials_by_readiness_tier: {
    high: number;
    medium: number;
    low: number;
  };
  missing_fields: {
    uom: number;
    classification: number;
    technical_specification: number;
    manufacturer_part_number: number;
  };
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  parent_id?: string | null;
  description?: string | null;
}

export interface TaxonomyAttribute {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  data_type: string;
  is_required: boolean;
}

export interface EvaluationDataset {
  id: string;
  name: string;
  description?: string | null;
}

export interface EvaluationLabel {
  id: string;
  dataset_id: string;
  material_a_id: string;
  material_b_id: string;
  expert_label: string;
}

export interface EvaluationRun {
  id: string;
  dataset_id: string;
  precision: number;
  recall: number;
  false_merge_rate: number;
  notes?: string | null;
}

export interface PrecheckCandidate {
  material_id: string;
  common_code?: string | null;
  description: string;
  score: number;
  decision: string;
}

export interface MaterialPrecheckRequest {
  description: string;
  specification?: string | null;
  uom?: string | null;
  classification?: string | null;
  manufacturer?: string | null;
  manufacturer_part_number?: string | null;
  attributes_json?: Record<string, string>;
}

export interface MaterialPrecheckResponse {
  readiness_score: number;
  missing_critical_fields: string[];
  candidates: PrecheckCandidate[];
}
