import { prisma } from '@/lib/db';
import Link from 'next/link';

// Force dynamic rendering since this page uses database queries
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const query = typeof params.query === 'string' ? params.query : undefined;
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  
  if (status) {
    where.status = status;
  }
  
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { department: { contains: query, mode: 'insensitive' } },
    ];
  }

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      include: {
        skills: {
          include: { skill: true },
          take: 5,
        },
        _count: {
          select: { applications: true },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <Link
          href="/ats/jobs/new"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + New Job
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form className="flex items-center gap-4">
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search by title or department..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="status"
            defaultValue={status || ''}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Results Info */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {jobs.length} of {total} jobs
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first job posting</p>
          <Link
            href="/ats/jobs/new"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + New Job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/ats/jobs/${job.id}`}
              className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    {job.priority > 0 && (
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                        Priority
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {job.department && <span>{job.department}</span>}
                    {job.location && <span>• {job.location}</span>}
                    {job.locationType && (
                      <span className="capitalize">• {job.locationType.replace('_', ' ')}</span>
                    )}
                    {job.employmentType && (
                      <span className="capitalize">• {job.employmentType.replace('_', ' ')}</span>
                    )}
                  </div>
                  {(job.salaryMin || job.salaryMax) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Salary: {job.salaryMin ? `${job.salaryCurrency}${job.salaryMin.toLocaleString()}` : ''}
                      {job.salaryMin && job.salaryMax ? ' - ' : ''}
                      {job.salaryMax ? `${job.salaryCurrency}${job.salaryMax.toLocaleString()}` : ''}
                    </p>
                  )}
                  {job.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.skills.map((js) => (
                        <span
                          key={js.id}
                          className={`px-2 py-1 text-xs rounded ${
                            js.required 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {js.skill.name}{js.required ? '*' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p className="font-medium text-lg text-gray-700">
                    {job._count.applications}
                  </p>
                  <p>applicants</p>
                  <p className="mt-2">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                  {job.closingDate && (
                    <p className="text-orange-600">
                      Closes {new Date(job.closingDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/ats/jobs?page=${page - 1}${status ? `&status=${status}` : ''}${query ? `&query=${query}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/ats/jobs?page=${page + 1}${status ? `&status=${status}` : ''}${query ? `&query=${query}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    open: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-red-100 text-red-800',
    filled: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || colors.draft;
}
