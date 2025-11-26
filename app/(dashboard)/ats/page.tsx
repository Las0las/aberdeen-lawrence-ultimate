import { prisma } from '@/lib/db';
import Link from 'next/link';
import { NLQueryInterface } from '@/components/ats/NLQueryInterface';

// Force dynamic rendering since this page uses database queries
export const dynamic = 'force-dynamic';

export default async function ATSDashboard() {
  // Get summary statistics
  const [
    candidatesCount,
    activeCandidatesCount,
    jobsCount,
    openJobsCount,
    applicationsCount,
    documentsCount,
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.candidate.count({ where: { status: 'active' } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: 'open' } }),
    prisma.jobApplication.count(),
    prisma.document.count(),
  ]);

  // Get recent candidates
  const recentCandidates = await prisma.candidate.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { applications: true, documents: true } },
    },
  });

  // Get recent jobs
  const recentJobs = await prisma.job.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { applications: true } },
    },
  });

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">AI-ATS Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Link
            href="/ats/candidates/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Candidate
          </Link>
          <Link
            href="/ats/jobs/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + New Job
          </Link>
        </div>
      </div>

      {/* Natural Language Search */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Smart Search</h2>
        <NLQueryInterface />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Total Candidates"
          value={candidatesCount}
          color="blue"
          href="/ats/candidates"
        />
        <StatCard
          title="Active Candidates"
          value={activeCandidatesCount}
          color="green"
          href="/ats/candidates?status=active"
        />
        <StatCard
          title="Total Jobs"
          value={jobsCount}
          color="purple"
          href="/ats/jobs"
        />
        <StatCard
          title="Open Jobs"
          value={openJobsCount}
          color="teal"
          href="/ats/jobs?status=open"
        />
        <StatCard
          title="Applications"
          value={applicationsCount}
          color="orange"
        />
        <StatCard
          title="Documents"
          value={documentsCount}
          color="pink"
          href="/ats/documents"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Candidates */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Candidates</h2>
            <Link href="/ats/candidates" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          {recentCandidates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No candidates yet</p>
          ) : (
            <ul className="space-y-3">
              {recentCandidates.map((candidate) => (
                <li key={candidate.id}>
                  <Link
                    href={`/ats/candidates/${candidate.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">
                        {candidate.firstName} {candidate.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{candidate.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded ${
                        candidate.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {candidate._count.applications} applications
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Jobs</h2>
            <Link href="/ats/jobs" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No jobs yet</p>
          ) : (
            <ul className="space-y-3">
              {recentJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/ats/jobs/${job.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-gray-500">
                        {job.department || 'No department'} • {job.locationType || 'Not specified'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded ${getJobStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {job._count.applications} applicants
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
  href,
}: {
  title: string;
  value: number;
  color: string;
  href?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    teal: 'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
    pink: 'bg-pink-50 text-pink-600',
  };

  const content = (
    <div className={`p-4 rounded-lg ${colorClasses[color]} ${href ? 'hover:opacity-80' : ''}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium">{title}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function getJobStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    open: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-red-100 text-red-800',
    filled: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || colors.draft;
}
