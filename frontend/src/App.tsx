import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/auth/RequireAuth";
import { AppLayout } from "@/layouts/AppLayout";
import ApprovalDetailPage from "@/pages/ApprovalDetail";
import Approvals from "@/pages/Approvals";
import Analytics from "@/pages/Analytics";
import AuditLogPage from "@/pages/AuditLog";
import CommonMaterialMaster from "@/pages/CommonMaterialMaster";
import CommonMaterialCodeDetailPage from "@/pages/CommonMaterialCodeDetail";
import Cpse from "@/pages/Cpse";
import CpseDetail from "@/pages/CpseDetail";
import Dashboard from "@/pages/Dashboard";


import HarmonizationList from "@/pages/HarmonizationList";
import ImportHistory from "@/pages/ImportHistory";
import HarmonizationPairDetail from "@/pages/HarmonizationPairDetail";
import LegacyCodes from "@/pages/LegacyCodes";
import LegacyCodeDetail from "@/pages/LegacyCodeDetail";
import MaterialAnalysis from "@/pages/MaterialAnalysis";
import MaterialDetail from "@/pages/MaterialDetail";
import Materials from "@/pages/Materials";
import MaterialUpload from "@/pages/MaterialUpload";
import NotFound from "@/pages/NotFound";
import Notifications from "@/pages/Notifications";
import ProcurementAnalytics from "@/pages/ProcurementAnalytics";

import Settings from "@/pages/Settings";
import SectorSelection from "@/pages/SectorSelection";
import AnalysisModeSelection from "@/pages/AnalysisModeSelection";
import BulkCpseSelection from "@/pages/BulkCpseSelection";
import BulkCpseUpload from "@/pages/BulkCpseUpload";
import DataReadiness from "@/pages/DataReadiness";
import Taxonomy from "@/pages/Taxonomy";
import AiEvaluation from "@/pages/AiEvaluation";
import NewMaterialPrecheck from "@/pages/NewMaterialPrecheck";

const REVIEW_ROLES = ["ADMIN", "MATERIAL_EXPERT", "REVIEWER", "VIEWER"] as const;

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Material Master */}
        <Route path="/materials" element={<Materials />} />
        <Route path="/materials/cpse" element={<Materials />} />
        <Route path="/material-upload" element={<MaterialUpload />} />
        <Route path="/materials/upload/history" element={<ImportHistory />} />
        <Route path="/materials/:id" element={<MaterialDetail />} />
        <Route path="/materials/:id/analysis" element={<MaterialAnalysis />} />
        <Route path="/common-material-master" element={<CommonMaterialMaster />} />
        <Route path="/common-material-master/:code" element={<CommonMaterialCodeDetailPage />} />
        <Route path="/legacy-codes" element={<LegacyCodes />} />
        <Route path="/legacy-codes/:code" element={<LegacyCodeDetail />} />

        {/* Harmonization */}
        <Route path="/harmonization" element={<Navigate to="/harmonization/recommendations" replace />} />
        <Route path="/harmonization/recommendations" element={<HarmonizationList />} />
        <Route path="/harmonization/duplicates" element={<HarmonizationList />} />
        <Route path="/harmonization/near-duplicates" element={<HarmonizationList />} />
        <Route path="/harmonization/functional-equivalence" element={<HarmonizationList />} />
        <Route path="/harmonization/technical-conflicts" element={<HarmonizationList />} />
        <Route path="/harmonization/pairs/:mappingId" element={<HarmonizationPairDetail />} />

        {/* CPSE Network */}
        <Route path="/cpse/sectors" element={<SectorSelection />} />
        <Route path="/cpse/sectors/:sector/analysis-mode" element={<AnalysisModeSelection />} />
        <Route path="/cpse/sectors/:sector/single" element={<Cpse />} />
        <Route path="/cpse/bulk-add" element={<BulkCpseUpload />} />
        <Route path="/cpse/sectors/:sector/bulk" element={<BulkCpseSelection />} />
        <Route path="/cpse" element={<Cpse />} />
        <Route path="/cpse/:id" element={<CpseDetail />} />



        {/* Approvals */}
        <Route
          path="/approvals"
          element={<Navigate to="/approvals/pending" replace />}
        />
        <Route
          path="/approvals/pending"
          element={
            <RequireAuth roles={[...REVIEW_ROLES]}>
              <Approvals />
            </RequireAuth>
          }
        />
        <Route
          path="/approvals/approved"
          element={
            <RequireAuth roles={[...REVIEW_ROLES]}>
              <Approvals />
            </RequireAuth>
          }
        />
        <Route
          path="/approvals/rejected"
          element={
            <RequireAuth roles={[...REVIEW_ROLES]}>
              <Approvals />
            </RequireAuth>
          }
        />
        <Route
          path="/approvals/:id"
          element={
            <RequireAuth roles={[...REVIEW_ROLES]}>
              <ApprovalDetailPage />
            </RequireAuth>
          }
        />

        {/* Analytics */}
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/analytics/procurement" element={<ProcurementAnalytics />} />

        <Route path="/analytics/classification" element={<Analytics />} />
        <Route path="/analytics/trends" element={<Analytics />} />
        <Route path="/analytics/data-readiness" element={<DataReadiness />} />

        {/* Governance */}
        <Route path="/governance/taxonomy" element={<Taxonomy />} />
        <Route path="/governance/ai-evaluation" element={<AiEvaluation />} />
        <Route path="/precheck" element={<NewMaterialPrecheck />} />
        <Route
          path="/audit-log"
          element={
            <RequireAuth roles={[...REVIEW_ROLES]}>
              <AuditLogPage />
            </RequireAuth>
          }
        />
        <Route
          path="/governance/rules"
          element={
            <RequireAuth roles={["ADMIN"]}>
              <Settings />
            </RequireAuth>
          }
        />

        {/* System */}
        <Route path="/notifications" element={<Notifications />} />
        <Route
          path="/settings"
          element={
            <RequireAuth roles={["ADMIN"]}>
              <Settings />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
